#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use serde::Serialize;
use std::fs;
use std::path::{Path, PathBuf};
use std::process::Command;
use std::time::{SystemTime, UNIX_EPOCH};
use tauri::{AppHandle, Manager};
use tauri_plugin_sql::{Migration, MigrationKind};

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct ManagedCourseSchedule {
  schedule_path: String,
  schedule_preview_path: Option<String>,
  schedule_file_name: String,
  schedule_file_type: String,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct RestoreDatabaseResult {
  restored_path: String,
  previous_backup_path: String,
}

fn database_path(app: &AppHandle) -> Result<PathBuf, String> {
  Ok(
    app
      .path()
      .app_local_data_dir()
      .map_err(|err| format!("获取应用数据目录失败：{err}"))?
      .join("classroom.db"),
  )
}

fn detect_schedule_file_type(path: &Path) -> Result<String, String> {
  let extension = path
    .extension()
    .and_then(|ext| ext.to_str())
    .map(|ext| ext.to_lowercase())
    .ok_or_else(|| "无法识别课表文件类型".to_string())?;

  match extension.as_str() {
    "xlsx" | "xls" | "numbers" | "pdf" | "png" | "jpg" | "jpeg" | "webp" | "gif" => Ok(extension),
    _ => Err("仅支持 .xlsx、.xls、.numbers、.pdf 或图片文件".to_string()),
  }
}

fn remove_path_if_exists(path: &Path) -> Result<(), String> {
  if !path.exists() {
    return Ok(());
  }

  if path.is_dir() {
    fs::remove_dir_all(path).map_err(|err| format!("删除旧课表资源失败：{err}"))?;
  } else {
    fs::remove_file(path).map_err(|err| format!("删除旧课表文件失败：{err}"))?;
  }

  Ok(())
}

fn copy_dir_all(from: &Path, to: &Path) -> Result<(), String> {
  fs::create_dir_all(to).map_err(|err| format!("创建目录失败：{err}"))?;
  let entries = fs::read_dir(from).map_err(|err| format!("读取目录失败：{err}"))?;

  for entry in entries {
    let entry = entry.map_err(|err| format!("读取目录项失败：{err}"))?;
    let entry_path = entry.path();
    let target_path = to.join(entry.file_name());
    if entry_path.is_dir() {
      copy_dir_all(&entry_path, &target_path)?;
    } else {
      if let Some(parent) = target_path.parent() {
        fs::create_dir_all(parent).map_err(|err| format!("创建目录失败：{err}"))?;
      }
      fs::copy(&entry_path, &target_path).map_err(|err| format!("复制文件失败：{err}"))?;
    }
  }

  Ok(())
}

fn copy_path(from: &Path, to: &Path) -> Result<(), String> {
  remove_path_if_exists(to)?;

  if from.is_dir() {
    copy_dir_all(from, to)
  } else {
    if let Some(parent) = to.parent() {
      fs::create_dir_all(parent).map_err(|err| format!("创建目录失败：{err}"))?;
    }
    fs::copy(from, to).map_err(|err| format!("复制课表失败：{err}"))?;
    Ok(())
  }
}

fn paths_point_to_same_file(left: &Path, right: &Path) -> bool {
  if !left.exists() || !right.exists() {
    return false;
  }

  match (left.canonicalize(), right.canonicalize()) {
    (Ok(left), Ok(right)) => left == right,
    _ => false,
  }
}

#[cfg(target_os = "macos")]
fn generate_numbers_preview_internal(source_path: &Path, output_path: &Path) -> Result<(), String> {
  if let Some(parent) = output_path.parent() {
    fs::create_dir_all(parent).map_err(|err| format!("创建预览目录失败：{err}"))?;
  }

  let output = Command::new("osascript")
    .arg("-e")
    .arg("on run argv")
    .arg("-e")
    .arg("set sourcePath to POSIX file (item 1 of argv)")
    .arg("-e")
    .arg("set outputPath to POSIX file (item 2 of argv)")
    .arg("-e")
    .arg("tell application \"Numbers\"")
    .arg("-e")
    .arg("set documentRef to open sourcePath")
    .arg("-e")
    .arg("delay 1")
    .arg("-e")
    .arg("export documentRef to outputPath as PDF")
    .arg("-e")
    .arg("close documentRef saving no")
    .arg("-e")
    .arg("end tell")
    .arg("-e")
    .arg("end run")
    .arg(source_path)
    .arg(output_path)
    .output()
    .map_err(|err| format!("调用 Numbers 导出 PDF 失败：{err}"))?;

  if !output.status.success() {
    let stderr = String::from_utf8_lossy(&output.stderr).trim().to_string();
    return Err(if stderr.is_empty() {
      "Numbers 预览导出失败，请确认系统已安装 Numbers".to_string()
    } else {
      format!("Numbers 预览导出失败：{stderr}")
    });
  }

  if !output_path.exists() {
    return Err("Numbers 预览导出失败：未生成 PDF 文件".to_string());
  }

  Ok(())
}

#[cfg(not(target_os = "macos"))]
fn generate_numbers_preview_internal(_source_path: &Path, _output_path: &Path) -> Result<(), String> {
  Err("当前系统暂不支持 Numbers 预览".to_string())
}

#[tauri::command]
fn prepare_course_schedule(
  app: AppHandle,
  course_id: String,
  source_path: String,
  generate_preview: Option<bool>,
) -> Result<ManagedCourseSchedule, String> {
  let source = PathBuf::from(&source_path);
  if !source.exists() {
    return Err("课表源文件不存在，请重新上传".to_string());
  }

  let file_type = detect_schedule_file_type(&source)?;
  let file_name = source
    .file_name()
    .and_then(|value| value.to_str())
    .map(|value| value.to_string())
    .ok_or_else(|| "无法读取课表文件名".to_string())?;

  let managed_root = app
    .path()
    .app_local_data_dir()
    .map_err(|err| format!("获取应用数据目录失败：{err}"))?
    .join("course-schedules")
    .join(&course_id);

  remove_path_if_exists(&managed_root)?;
  fs::create_dir_all(&managed_root).map_err(|err| format!("创建课表目录失败：{err}"))?;

  let managed_source = managed_root.join(format!("source.{file_type}"));
  copy_path(&source, &managed_source)?;

  let should_generate_preview = generate_preview.unwrap_or(false);
  let preview_path = if file_type == "numbers" && should_generate_preview {
    let preview = managed_root.join("preview.pdf");
    generate_numbers_preview_internal(&managed_source, &preview)?;
    Some(preview.to_string_lossy().to_string())
  } else {
    None
  };

  Ok(ManagedCourseSchedule {
    schedule_path: managed_source.to_string_lossy().to_string(),
    schedule_preview_path: preview_path,
    schedule_file_name: file_name,
    schedule_file_type: file_type,
  })
}

#[tauri::command]
fn generate_numbers_preview(app: AppHandle, course_id: String) -> Result<String, String> {
  let managed_root = app
    .path()
    .app_local_data_dir()
    .map_err(|err| format!("获取应用数据目录失败：{err}"))?
    .join("course-schedules")
    .join(&course_id);

  let source_path = managed_root.join("source.numbers");
  if !source_path.exists() {
    return Err("未找到已托管的 Numbers 课表，请重新上传".to_string());
  }

  let preview_path = managed_root.join("preview.pdf");
  generate_numbers_preview_internal(&source_path, &preview_path)?;
  Ok(preview_path.to_string_lossy().to_string())
}

#[tauri::command]
fn export_course_schedule(source_path: String, target_path: String) -> Result<(), String> {
  let source = PathBuf::from(&source_path);
  if !source.exists() {
    return Err("课表源文件不存在，请重新上传".to_string());
  }

  let target = PathBuf::from(&target_path);
  copy_path(&source, &target)
}

#[tauri::command]
fn backup_database(app: AppHandle, target_path: String) -> Result<String, String> {
  let source = database_path(&app)?;
  if !source.exists() {
    return Err("当前数据库文件不存在，无法备份".to_string());
  }

  let target = PathBuf::from(&target_path);
  if paths_point_to_same_file(&source, &target) {
    return Err("备份目标不能是当前正在使用的数据库文件".to_string());
  }

  copy_path(&source, &target)?;
  Ok(target.to_string_lossy().to_string())
}

#[tauri::command]
fn restore_database(app: AppHandle, source_path: String) -> Result<RestoreDatabaseResult, String> {
  let source = PathBuf::from(&source_path);
  if !source.exists() {
    return Err("备份文件不存在，请重新选择".to_string());
  }
  if source.is_dir() {
    return Err("请选择数据库备份文件，而不是文件夹".to_string());
  }

  let target = database_path(&app)?;
  if paths_point_to_same_file(&source, &target) {
    return Err("恢复来源不能是当前正在使用的数据库文件".to_string());
  }

  if let Some(parent) = target.parent() {
    fs::create_dir_all(parent).map_err(|err| format!("创建数据库目录失败：{err}"))?;
  }

  let timestamp = SystemTime::now()
    .duration_since(UNIX_EPOCH)
    .map_err(|err| format!("生成恢复备份时间戳失败：{err}"))?
    .as_secs();
  let previous_backup = target.with_extension(format!("db.before-restore-{timestamp}"));

  if target.exists() {
    copy_path(&target, &previous_backup)?;
  }
  copy_path(&source, &target)?;

  Ok(RestoreDatabaseResult {
    restored_path: target.to_string_lossy().to_string(),
    previous_backup_path: previous_backup.to_string_lossy().to_string(),
  })
}

#[tauri::command]
fn delete_course_schedule(app: AppHandle, course_id: String) -> Result<(), String> {
  let managed_root = app
    .path()
    .app_local_data_dir()
    .map_err(|err| format!("获取应用数据目录失败：{err}"))?
    .join("course-schedules")
    .join(course_id);

  remove_path_if_exists(&managed_root)
}

fn main() {
  let migrations = vec![
    Migration {
      version: 1,
      description: "create_delivery_classes",
      sql: include_str!("../migrations/0001_create_delivery_classes.sql"),
      kind: MigrationKind::Up,
    },
    Migration {
      version: 2,
      description: "create_dev_tables",
      sql: include_str!("../migrations/0002_create_dev_tables.sql"),
      kind: MigrationKind::Up,
    },
  ];

  tauri::Builder::default()
    .setup(|app| {
      #[cfg(desktop)]
      app.handle().plugin(tauri_plugin_updater::Builder::new().build())?;
      Ok(())
    })
    .plugin(tauri_plugin_dialog::init())
    .plugin(tauri_plugin_fs::init())
    .plugin(tauri_plugin_opener::init())
    .plugin(tauri_plugin_process::init())
    .invoke_handler(tauri::generate_handler![
      prepare_course_schedule,
      generate_numbers_preview,
      export_course_schedule,
      backup_database,
      restore_database,
      delete_course_schedule
    ])
    .plugin(
      tauri_plugin_sql::Builder::default()
        .add_migrations("sqlite:classroom.db", migrations)
        .build(),
    )
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}

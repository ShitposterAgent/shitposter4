use axum::{
    extract::State,
    http::{Method, StatusCode},
    routing::{get, post},
    Json, Router,
};
use serde::{Deserialize, Serialize};
use std::{
    fs,
    path::Path,
    sync::Arc,
};
use tokio::sync::Mutex;
use tower_http::cors::{Any, CorsLayer};
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};

#[derive(Clone)]
struct AppState {
    base_path: Arc<Mutex<String>>,
}

#[derive(Deserialize)]
struct FileAction {
    action: String,
    path: Option<String>,
    content: Option<String>,
}

#[derive(Serialize)]
struct ActionResponse {
    status: String,
    message: String,
    data: Option<String>,
}

#[tokio::main]
async fn main() {
    tracing_subscriber::registry()
        .with(tracing_subscriber::fmt::layer())
        .init();

    let state = AppState {
        base_path: Arc::new(Mutex::new(String::from("/tmp"))),
    };

    let cors = CorsLayer::new()
        .allow_methods([Method::GET, Method::POST])
        .allow_origin(Any)
        .allow_headers(Any);

    let app = Router::new()
        .route("/init", post(init_base_path))
        .route("/action", post(execute_action))
        .route("/status", get(status))
        .layer(cors)
        .with_state(state);

    let listener = tokio::net::TcpListener::bind("127.0.0.1:3005").await.unwrap();
    tracing::info!("Listening on {}", listener.local_addr().unwrap());
    axum::serve(listener, app).await.unwrap();
}

async fn init_base_path(
    State(state): State<AppState>,
    Json(payload): Json<FileAction>,
) -> Result<Json<ActionResponse>, StatusCode> {
    if let Some(path) = payload.path {
        let path_obj = Path::new(&path);
        if !path_obj.exists() {
            return Ok(Json(ActionResponse {
                status: "error".to_string(),
                message: format!("Path does not exist: {}", path),
                data: None,
            }));
        }

        let mut base_path = state.base_path.lock().await;
        *base_path = path;

        Ok(Json(ActionResponse {
            status: "success".to_string(),
            message: format!("Base path set to: {}", base_path),
            data: None,
        }))
    } else {
        Ok(Json(ActionResponse {
            status: "error".to_string(),
            message: "Path parameter is required".to_string(),
            data: None,
        }))
    }
}

async fn execute_action(
    State(state): State<AppState>,
    Json(action): Json<FileAction>,
) -> Result<Json<ActionResponse>, StatusCode> {
    let base_path = state.base_path.lock().await.clone();

    match action.action.as_str() {
        "read_file" => {
            if let Some(path) = action.path {
                let full_path = format!("{}/{}", base_path, path);
                match fs::read_to_string(&full_path) {
                    Ok(content) => Ok(Json(ActionResponse {
                        status: "success".to_string(),
                        message: format!("File read successfully: {}", path),
                        data: Some(content),
                    })),
                    Err(e) => {
                        tracing::error!("Failed to read file: {:?}", e);
                        Ok(Json(ActionResponse {
                            status: "error".to_string(),
                            message: format!("Failed to read file: {}", e),
                            data: None,
                        }))
                    }
                }
            } else {
                Ok(Json(ActionResponse {
                    status: "error".to_string(),
                    message: "Path is required for reading a file".to_string(),
                    data: None,
                }))
            }
        },
        "write_file" => {
            if let (Some(path), Some(content)) = (action.path, action.content) {
                let full_path = format!("{}/{}", base_path, path);
                match fs::write(&full_path, content) {
                    Ok(_) => Ok(Json(ActionResponse {
                        status: "success".to_string(),
                        message: format!("File written successfully: {}", path),
                        data: None,
                    })),
                    Err(e) => {
                        tracing::error!("Failed to write file: {:?}", e);
                        Ok(Json(ActionResponse {
                            status: "error".to_string(),
                            message: format!("Failed to write file: {}", e),
                            data: None,
                        }))
                    }
                }
            } else {
                Ok(Json(ActionResponse {
                    status: "error".to_string(),
                    message: "Both path and content are required for writing a file".to_string(),
                    data: None,
                }))
            }
        },
        "list_files" => {
            if let Some(path) = action.path {
                let full_path = format!("{}/{}", base_path, path);
                match fs::read_dir(&full_path) {
                    Ok(entries) => {
                        let file_list: Result<Vec<String>, _> = entries
                            .map(|entry| {
                                entry.map(|e| e.file_name().to_string_lossy().into_owned())
                            })
                            .collect();
                        
                        match file_list {
                            Ok(files) => Ok(Json(ActionResponse {
                                status: "success".to_string(),
                                message: format!("Listed files in: {}", path),
                                data: Some(serde_json::to_string(&files).unwrap_or_default()),
                            })),
                            Err(e) => {
                                tracing::error!("Failed to list directory entries: {:?}", e);
                                Ok(Json(ActionResponse {
                                    status: "error".to_string(),
                                    message: format!("Failed to list directory entries: {}", e),
                                    data: None,
                                }))
                            }
                        }
                    },
                    Err(e) => {
                        tracing::error!("Failed to read directory: {:?}", e);
                        Ok(Json(ActionResponse {
                            status: "error".to_string(),
                            message: format!("Failed to read directory: {}", e),
                            data: None,
                        }))
                    }
                }
            } else {
                Ok(Json(ActionResponse {
                    status: "error".to_string(),
                    message: "Path is required for listing files".to_string(),
                    data: None,
                }))
            }
        },
        "delete_file" => {
            if let Some(path) = action.path {
                let full_path = format!("{}/{}", base_path, path);
                match fs::remove_file(&full_path) {
                    Ok(_) => Ok(Json(ActionResponse {
                        status: "success".to_string(),
                        message: format!("File deleted successfully: {}", path),
                        data: None,
                    })),
                    Err(e) => {
                        tracing::error!("Failed to delete file: {:?}", e);
                        Ok(Json(ActionResponse {
                            status: "error".to_string(),
                            message: format!("Failed to delete file: {}", e),
                            data: None,
                        }))
                    }
                }
            } else {
                Ok(Json(ActionResponse {
                    status: "error".to_string(),
                    message: "Path is required for deleting a file".to_string(),
                    data: None,
                }))
            }
        },
        _ => Ok(Json(ActionResponse {
            status: "error".to_string(),
            message: format!("Unsupported action: {}", action.action),
            data: None,
        })),
    }
}

async fn status() -> Result<Json<ActionResponse>, StatusCode> {
    Ok(Json(ActionResponse {
        status: "success".to_string(),
        message: "Server is running".to_string(),
        data: None,
    }))
}

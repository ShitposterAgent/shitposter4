use axum::{
    extract::State,
    http::{Method, StatusCode},
    routing::{get, post},
    Json, Router,
};
use futures::StreamExt;
use playwright::{Playwright, api::Browser};
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use tokio::sync::Mutex;
use tower_http::cors::{Any, CorsLayer};
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};

#[derive(Clone)]
struct AppState {
    playwright: Arc<Mutex<Option<Playwright>>>,
    browser: Arc<Mutex<Option<Browser>>>,
}

#[derive(Deserialize)]
struct BrowserAction {
    action: String,
    url: Option<String>,
    selector: Option<String>,
    text: Option<String>,
}

#[derive(Serialize)]
struct ActionResponse {
    status: String,
    message: String,
}

#[tokio::main]
async fn main() {
    tracing_subscriber::registry()
        .with(tracing_subscriber::EnvFilter::new("info"))
        .with(tracing_subscriber::fmt::layer())
        .init();

    let state = AppState {
        playwright: Arc::new(Mutex::new(None)),
        browser: Arc::new(Mutex::new(None)),
    };

    let cors = CorsLayer::new()
        .allow_methods([Method::GET, Method::POST])
        .allow_origin(Any)
        .allow_headers(Any);

    let app = Router::new()
        .route("/init", post(init_playwright))
        .route("/action", post(execute_action))
        .route("/status", get(status))
        .layer(cors)
        .with_state(state);

    let listener = tokio::net::TcpListener::bind("127.0.0.1:3001").await.unwrap();
    tracing::info!("Listening on {}", listener.local_addr().unwrap());
    axum::serve(listener, app).await.unwrap();
}

async fn init_playwright(
    State(state): State<AppState>,
) -> Result<Json<ActionResponse>, StatusCode> {
    let mut pw_guard = state.playwright.lock().await;
    if pw_guard.is_some() {
        return Ok(Json(ActionResponse {
            status: "success".to_string(),
            message: "Playwright already initialized".to_string(),
        }));
    }

    match playwright::Playwright::initialize().await {
        Ok(pw) => {
            let browser_builder = pw.chromium();
            match browser_builder.launcher().launch().await {
                Ok(browser) => {
                    let mut browser_guard = state.browser.lock().await;
                    *browser_guard = Some(browser);
                    *pw_guard = Some(pw);

                    Ok(Json(ActionResponse {
                        status: "success".to_string(),
                        message: "Playwright and browser initialized".to_string(),
                    }))
                }
                Err(e) => {
                    tracing::error!("Failed to launch browser: {:?}", e);
                    Err(StatusCode::INTERNAL_SERVER_ERROR)
                }
            }
        }
        Err(e) => {
            tracing::error!("Failed to initialize Playwright: {:?}", e);
            Err(StatusCode::INTERNAL_SERVER_ERROR)
        }
    }
}

async fn execute_action(
    State(state): State<AppState>,
    Json(action): Json<BrowserAction>,
) -> Result<Json<ActionResponse>, StatusCode> {
    let browser_guard = state.browser.lock().await;
    let browser = match &*browser_guard {
        Some(browser) => browser,
        None => {
            return Ok(Json(ActionResponse {
                status: "error".to_string(),
                message: "Browser not initialized. Call /init first.".to_string(),
            }));
        }
    };

    match action.action.as_str() {
        "navigate" => {
            if let Some(url) = &action.url {
                let context = browser.context(None).await.map_err(|e| {
                    tracing::error!("Failed to create context: {:?}", e);
                    StatusCode::INTERNAL_SERVER_ERROR
                })?;

                let page = context.new_page().await.map_err(|e| {
                    tracing::error!("Failed to create page: {:?}", e);
                    StatusCode::INTERNAL_SERVER_ERROR
                })?;

                page.goto_builder(url).goto().await.map_err(|e| {
                    tracing::error!("Failed to navigate: {:?}", e);
                    StatusCode::INTERNAL_SERVER_ERROR
                })?;

                Ok(Json(ActionResponse {
                    status: "success".to_string(),
                    message: format!("Navigated to {}", url),
                }))
            } else {
                Ok(Json(ActionResponse {
                    status: "error".to_string(),
                    message: "URL is required for navigation".to_string(),
                }))
            }
        }
        "click" => {
            if let Some(selector) = &action.selector {
                let context = browser.context(None).await.map_err(|e| {
                    tracing::error!("Failed to create context: {:?}", e);
                    StatusCode::INTERNAL_SERVER_ERROR
                })?;

                let pages = context.pages().await;
                if pages.is_empty() {
                    return Ok(Json(ActionResponse {
                        status: "error".to_string(),
                        message: "No pages open".to_string(),
                    }));
                }

                let page = &pages[0];
                page.click(selector, None).await.map_err(|e| {
                    tracing::error!("Failed to click: {:?}", e);
                    StatusCode::INTERNAL_SERVER_ERROR
                })?;

                Ok(Json(ActionResponse {
                    status: "success".to_string(),
                    message: format!("Clicked on {}", selector),
                }))
            } else {
                Ok(Json(ActionResponse {
                    status: "error".to_string(),
                    message: "Selector is required for clicking".to_string(),
                }))
            }
        }
        "type" => {
            if let (Some(selector), Some(text)) = (&action.selector, &action.text) {
                let context = browser.context(None).await.map_err(|e| {
                    tracing::error!("Failed to create context: {:?}", e);
                    StatusCode::INTERNAL_SERVER_ERROR
                })?;

                let pages = context.pages().await;
                if pages.is_empty() {
                    return Ok(Json(ActionResponse {
                        status: "error".to_string(),
                        message: "No pages open".to_string(),
                    }));
                }

                let page = &pages[0];
                page.fill(selector, text, None).await.map_err(|e| {
                    tracing::error!("Failed to type text: {:?}", e);
                    StatusCode::INTERNAL_SERVER_ERROR
                })?;

                Ok(Json(ActionResponse {
                    status: "success".to_string(),
                    message: format!("Typed text into {}", selector),
                }))
            } else {
                Ok(Json(ActionResponse {
                    status: "error".to_string(),
                    message: "Both selector and text are required for typing".to_string(),
                }))
            }
        }
        _ => Ok(Json(ActionResponse {
            status: "error".to_string(),
            message: format!("Unsupported action: {}", action.action),
        })),
    }
}

async fn status() -> Result<Json<ActionResponse>, StatusCode> {
    Ok(Json(ActionResponse {
        status: "success".to_string(),
        message: "Server is running".to_string(),
    }))
}

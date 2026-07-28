//! Temporary runtime harness, not committed.
//! Usage: cargo run --example serve -- <data_path>

#[tokio::main]
async fn main() {
    tracing_subscriber::fmt()
        .with_env_filter(
            tracing_subscriber::EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| "silex_server=debug".into()),
        )
        .init();

    let data_path = std::env::args().nth(1).expect("usage: serve <data_path>");
    let (app, port) = silex_server::build_app(silex_server::Config::new(data_path.into())).await;

    let listener = tokio::net::TcpListener::bind(("127.0.0.1", port))
        .await
        .unwrap();
    println!("listening on http://127.0.0.1:{}", port);
    axum::serve(listener, app).await.unwrap();
}

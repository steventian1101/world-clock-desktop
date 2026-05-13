#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::{
    menu::{CheckMenuItem, Menu, MenuItem, PredefinedMenuItem},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    AppHandle, Emitter, Manager, RunEvent, Runtime, WindowEvent,
};
use tauri_plugin_autostart::{MacosLauncher, ManagerExt};

const AUTOSTART_ARG: &str = "--hidden";

fn show_main_window<R: Runtime>(app: &AppHandle<R>) {
    if let Some(window) = app.get_webview_window("main") {
        let _ = window.show();
        let _ = window.unminimize();
        let _ = window.set_focus();
    }
}

fn hide_main_window<R: Runtime>(app: &AppHandle<R>) {
    if let Some(window) = app.get_webview_window("main") {
        let _ = window.hide();
    }
}

fn main() {
    let app = tauri::Builder::default()
        .plugin(tauri_plugin_single_instance::init(|app, _argv, _cwd| {
            show_main_window(app);
        }))
        .plugin(tauri_plugin_window_state::Builder::default().build())
        .plugin(tauri_plugin_autostart::init(
            MacosLauncher::LaunchAgent,
            Some(vec![AUTOSTART_ARG]),
        ))
        .setup(|app| {
            let handle = app.handle().clone();

            let started_hidden = std::env::args().any(|a| a == AUTOSTART_ARG);
            if started_hidden {
                hide_main_window(&handle);
            }

            let show_item = MenuItem::with_id(&handle, "show", "Show World Clock", true, None::<&str>)?;
            let hide_item = MenuItem::with_id(&handle, "hide", "Hide Window", true, None::<&str>)?;
            let sep1 = PredefinedMenuItem::separator(&handle)?;
            let autostart_enabled = handle.autolaunch().is_enabled().unwrap_or(false);
            let autostart_item = CheckMenuItem::with_id(
                &handle,
                "toggle_autostart",
                "Start with Windows",
                true,
                autostart_enabled,
                None::<&str>,
            )?;
            let settings_item =
                MenuItem::with_id(&handle, "open_settings", "Settings...", true, None::<&str>)?;
            let sep2 = PredefinedMenuItem::separator(&handle)?;
            let exit_item = MenuItem::with_id(&handle, "exit", "Exit", true, None::<&str>)?;

            let menu = Menu::with_items(
                &handle,
                &[
                    &show_item,
                    &hide_item,
                    &sep1,
                    &autostart_item,
                    &settings_item,
                    &sep2,
                    &exit_item,
                ],
            )?;

            let autostart_item_for_handler = autostart_item.clone();

            let _tray = TrayIconBuilder::with_id("main-tray")
                .icon(handle.default_window_icon().unwrap().clone())
                .tooltip("World Clock")
                .menu(&menu)
                .show_menu_on_left_click(false)
                .on_menu_event(move |app, event| match event.id().as_ref() {
                    "show" => show_main_window(app),
                    "hide" => hide_main_window(app),
                    "open_settings" => {
                        show_main_window(app);
                        let _ = app.emit("tray://open-settings", ());
                    }
                    "toggle_autostart" => {
                        let manager = app.autolaunch();
                        let currently = manager.is_enabled().unwrap_or(false);
                        let next = !currently;
                        let ok = if next {
                            manager.enable().is_ok()
                        } else {
                            manager.disable().is_ok()
                        };
                        let final_state = if ok { next } else { currently };
                        let _ = autostart_item_for_handler.set_checked(final_state);
                        let _ = app.emit("tray://autostart-changed", final_state);
                    }
                    "exit" => {
                        app.exit(0);
                    }
                    _ => {}
                })
                .on_tray_icon_event(|tray, event| {
                    if let TrayIconEvent::Click {
                        button: MouseButton::Left,
                        button_state: MouseButtonState::Up,
                        ..
                    } = event
                    {
                        show_main_window(tray.app_handle());
                    }
                })
                .build(&handle)?;

            Ok(())
        })
        .on_window_event(|window, event| {
            if let WindowEvent::CloseRequested { api, .. } = event {
                api.prevent_close();
                let _ = window.hide();
            }
        })
        .build(tauri::generate_context!())
        .expect("error while building tauri application");

    app.run(|_app, event| {
        if let RunEvent::ExitRequested { api, code, .. } = event {
            if code.is_none() {
                api.prevent_exit();
            }
        }
    });
}

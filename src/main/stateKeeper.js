// Source - https://stackoverflow.com/a/68627253
// Posted by David Dehghan, modified by community. See post 'Timeline' for change history
// Retrieved 2026-09-08, License - CC BY-SA 4.0

import { screen } from 'electron';
import settings from "electron-settings"

export const windowStateKeeper = async (windowName) => {
    let window, windowState;

    const setBounds = async () => {
        // Restore from appConfig
        if (await settings.has(`windowState.${windowName}`)) {
            windowState = await settings.get(`windowState.${windowName}`);
            return;
        }

        // const size = screen.getPrimaryDisplay().workAreaSize;

        // Default
        windowState = {
            x: undefined,
            y: undefined,
            width: 1024,
            height: 768,
        };
    };

    const saveState = async () => {
        // bug: lots of save state events are called. they should be debounced
        if (!windowState.isMaximized) {
            windowState = window.getBounds();
        }
        windowState.isMaximized = window.isMaximized();
        await settings.set(`windowState.${windowName}`, windowState);
    };

    const track = async (win) => {
        window = win;
        ['resize', 'move', 'close'].forEach((event) => {
            win.on(event, saveState);
        });
    };

    await setBounds();

    return {
        x: windowState.x,
        y: windowState.y,
        width: windowState.width,
        height: windowState.height,
        isMaximized: windowState.isMaximized,
        track,
    };
};

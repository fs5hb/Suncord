/*
 * Vencord, a Discord client mod
 * Copyright (c) 2024 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import "./styles.css";

import { migratePluginSettings } from "@api/Settings";
import { classNameFactory } from "@api/Styles";
import { makeRange } from "@components/PluginSettings/components";
import { Devs } from "@utils/constants";
import definePlugin from "@utils/types";
import { ContextMenuApi, FluxDispatcher, Menu, React } from "@webpack/common";
import { RefObject } from "react";

import SpeedIcon from "./components/SpeedIcon";

const cl = classNameFactory("vc-media-playback-speed-");

const speeds = makeRange(0.25, 3.5, 0.25);

migratePluginSettings("MediaPlaybackSpeed", "AudioPlaybackSpeed");
export default definePlugin({
    name: "MediaPlaybackSpeed",
    description: "Adds an icon to change the playback speed of media embeds",
    authors: [Devs.D3SOX],

    playbackSpeedComponent(mediaRef: RefObject<HTMLMediaElement>) {
        const changeSpeed = (speed: number) => {
            const media = mediaRef.current;
            if (media) {
                media.playbackRate = speed;
            }
        };

        return (
            <button className={cl("icon")} onClick={e => {
                ContextMenuApi.openContextMenu(e, () =>
                    <Menu.Menu
                        navId="playback-speed"
                        onClose={() => FluxDispatcher.dispatch({ type: "CONTEXT_MENU_CLOSE" })}
                        aria-label="Playback speed control"
                    >
                        <Menu.MenuGroup
                            label="Playback speed"
                        >
                            {speeds.map(speed => (
                                <Menu.MenuItem
                                    key={speed}
                                    id={"speed-" + speed}
                                    label={`${speed}x`}
                                    action={() => changeSpeed(speed)}
                                />
                            ))}
                        </Menu.MenuGroup>

                    </Menu.Menu>
                );
            }}>
                <SpeedIcon />
            </button>
        );
    },

    patches: [
        // voice message embeds
        {
            find: "ComponentActions.VOICE_MESSAGE_PLAYBACK_STARTED",
            replacement: {
                match: /useCallback\(\(\)=>\{let \i=(\i).current;.{2300,3000}onVolumeShow:\i,onVolumeHide:\i\}\)/,
                replace: "$&,$self.playbackSpeedComponent($1)"
            }
        },
        // audio & video embeds
        {
            // need to pass media ref via props to make it easily accessible from inside controls
            find: "renderControls(){",
            replacement: {
                match: /onToggleMuted:this.toggleMuted,/,
                replace: "$&mediaRef:this.mediaRef,"
            }
        },
        {
            find: "AUDIO:\"AUDIO\"",
            replacement: {
                match: /onVolumeHide:\i,iconClassName:\i.controlIcon,sliderWrapperClassName:\i.volumeSliderWrapper\}\)\}\),/,
                replace: "$&$self.playbackSpeedComponent(this.props.mediaRef),"
            }
        }
    ]
});

/*
 * Copyright (C) 2017  Universidade de Aveiro, DETI/IEETA, Bioinformatics Group - http://bioinformatics.ua.pt/
 *
 * This file is part of Dicoogle/dicoogle-client-js.
 *
 * Dicoogle/dicoogle-client-js is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Dicoogle/dicoogle-client-js is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with Dicoogle.  If not, see <http://www.gnu.org/licenses/>.
 */

import { SuperAgentRequest } from "superagent";
import Endpoints from "./endpoints.js";
import { Socket } from "./socket.js";
import { andCall } from "./util.js";

/* Module for DICOM export presets. */

/** A DICOM export preset */
export interface ExportPreset {
    /** The name of the preset */
    name: string,
    /** The DICOM fields to export in sequence */
    fields: string[],
}

export class Presets {
    private _socket: Socket;

    constructor(socket) {
        this._socket = socket;
    }

    /**
     * Obtain a list of export presets available to the user logged in.
     * 
     * This operation requires the user to be authenticated.
     * 
     * @param callback the callback function
     */
    public get(callback?: (error?: Error, outcome?: ExportPreset[]) => void): Promise<ExportPreset[]>;

    /**
     * Obtain a list of export presets available to the given user by name.
     *
     * This operation requires the user to be authenticated.
     * Permission to access the given user's presets is granted
     * if the user logged in is an administrator or the same user.
     * 
     * @param username the username identifier
     * @param callback the callback function
     */
    public get(username: string, callback?: (error?: Error, outcome?: ExportPreset[]) => void): Promise<ExportPreset[]>;

    public get(username?: string | ((error?: Error, outcome?: ExportPreset[]) => void), callback?: (error: Error, outcome: ExportPreset[]) => void): Promise<ExportPreset[]> {

        let req: SuperAgentRequest;
        if (typeof username === 'string') {
            req = this._socket.get([Endpoints.PRESETS, username]);
        } else {
            if (typeof username === 'function' && !callback) {
                callback = username;
            }
      
            req = this._socket.get(Endpoints.PRESETS);
        }

        return andCall(req
            .accept('json')
            .then((resp) => resp.body), callback);
    }

    /**
     * Save an export preset for the given user.
     *
     * This operation requires the user to be authenticated.
     * Permission to save preset for the given user is granted
     * if the user logged in is an administrator or the same user.
     * 
     * @param username the username identifier
     * @param name the unique name of the new preset
     * @param fields the list of DICOM attributes/tags in the preset
     * @param callback the callback function
     */
    public save(username: string, name: string, fields: string[], callback?: (error?: Error) => void): Promise<void> {
        // send URIs as form data to prevent URI from being too long
        const body = fields.map(field => 'field=' + encodeURIComponent(field)).join('&');

        return andCall(this._socket.post([Endpoints.PRESETS, username, name])
            .type('form')
            .send(body)
            .then((_) => { /* discard response */ }
        ), callback);
    }

    /** Retrieve a list of DICOM fields known by Dicoogle.
     * 
     * This list is large and unlikely to change,
     * so prefer keeping it in memory instead of querying it every time.
     * 
     * @param callback the callback function
     */
    public fieldList(callback?: (error?: Error, list?: string[]) => void): Promise<string[]> {
        return andCall(this._socket.get(['export', 'list'])
            .accept('json')
            .then((resp) => resp.body), callback);
    }
}

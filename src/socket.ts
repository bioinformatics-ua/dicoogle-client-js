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

import superagent from 'superagent'
import {SuperAgentRequest} from 'superagent';
import Endpoints from './endpoints';

export class Socket {
    private _user: string;
    private _roles: string[];
    private _token: string;
    private _url: string;

    constructor(url = undefined) {
        /** @private */
        this._user = null;
        /** @private */
        this._roles = null;
        /** @private */
        this._token = null;
        /** @private */
        this._url = url;

        if (typeof url !== 'string') {
            if (typeof window === 'object') {
                /* eslint-disable no-undef */
                this._url = window.location.protocol + "//" + window.location.host;
                /* eslint-enable no-undef */
            } else {
                throw new Error("Missing URL to Dicoogle services");
            }
        }

        if (this._url[this._url.length - 1] === '/') {
            this._url = this._url.slice(-1);
        }
    }

    public login(username: string, password, callback) {

        this.request('POST', Endpoints.LOGIN)
            .type('application/x-www-form-urlencoded')
            .send({username, password})
            .end((err, res) => {
                if (err) {
                    if (typeof callback === 'function') {
                        callback(err);
                    }
                    return;
                }
                const data = res.body;
                this._token = data.token;
                this._user = data.user;
                this._roles = data.roles;
                if (typeof callback === 'function') {
                    callback(null, data);
                }
            });
    }

    restore(token: string, callback: (error?: Error, data?: any) => void) {
        this.get(Endpoints.LOGIN)
            .set('Authorization', token)
            .end((err, res) => {
                if (err) {
                    if (typeof callback === 'function') {
                        callback(err);
                    }
                    return;
                }
                const data = res.body;
                this._token = token;
                this._user = data.user;
                this._roles = data.roles;
                if (typeof callback === 'function') {
                    callback(null, data);
                }
            });
    }

    public logout(callback: (error?: any) => void) {
        this.post(Endpoints.LOGOUT)
            .set('Authorization', this._token)
            .end(err => {
                if (!err) {
                    this.reset();
                    if (typeof callback === 'function') {
                        callback();
                    }
                } else {
                    this._logout_fallback(callback);
                }
            });
    }

    /** This is a fallback implementation of logout that uses GET instead of POST,
     * as in version 2.3.0 of Dicoogle.
     */
    private _logout_fallback(callback: (error:any) => void) {
        this.request('GET', Endpoints.LOGOUT)
            .end(err => {
                if (!err) {
                    this.reset();
                }
                if (typeof callback === 'function') {
                    callback(err);
                }
            });
    }

    /** Create a request to Dicoogle.
     * @param method - the intended HTTP method ('GET', 'POST', ...)
     * @param uri - the URI to the intended service, relative to Dicoogle's base URL
     * @returns a superagent object for a new request to this service
     */
    public request(method: string, uri: string | string[]): SuperAgentRequest {
        const req = superagent(method, [this._url].concat(uri).join('/'))
        if (this._token) {
            req.set('Authorization', this._token);
        }
        return req;
    }

    /** Create a GET request to Dicoogle.
     * @param uri - the URI to the intended service, relative to Dicoogle's base URL
     * @returns a superagent object for a new request to this service
     */
    public get(uri: string | string[]): SuperAgentRequest {
        return this.request('GET', uri);
    }

    /** Create a POST request to Dicoogle.
     * @param uri - the URI to the intended service, relative to Dicoogle's base URL
     * @returns a superagent object for a new request to this service
     */
    public post(uri: string | string[]): SuperAgentRequest {
        return this.request('POST', uri);
    }

    public getToken(): string | null {
        return this._token;
    }

    public setToken(token: string | null) {
        this._token = token;
    }

    public getUsername(): string | null {
        return this._user;
    }

    public getRoles(): string[] | null {
        return this._roles ? [].concat(this._roles) : null;
    }

    public getBase(): string {
        return this._url;
    }

    public hasToken(): boolean {
        return this._token !== null;
    }

    public reset(): void {
        this._user = null;
        this._token = null;
        this._roles = null;
    }
}

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

import Endpoints from './endpoints';
import {Socket} from './socket';
import {andCall} from './util';

export type password = string;

export interface User {
    username: string,
    roles?: string[],
    admin?: boolean,
}

export class UserService {
    private socket: Socket;
  
    constructor(socket) {
      this.socket = socket;
    }

    /** List all registered users.
     */
    list(callback?: (error: Error | null, users?: User[]) => void): Promise<User[]> {
        return andCall(this.socket.get(Endpoints.USER)
            .then((res) => res.body.users), callback)
    }

    /** Create a new user for Dicoogle.
     * 
     * @param username the new identifier of the user
     * @param password the new password
     * @param admin whether the account is an administrator
     */
    add(username: string, password: password, admin: boolean, callback?: (error: Error | null, success?: boolean) => void): Promise<boolean> {
        return andCall(this.socket.post(Endpoints.USER).query({username, password, admin})
            .catch((err) => {
                if (err.status === 405) {
                    // method not allowed means that we're using Dicoogle 2,
                    // so we try again with the PUT method
                    return this.socket.put(Endpoints.USER).query({username, password, admin});
                }
                throw err;
            })
            .then((res) => res.body.success), callback);
    }

    /** Remove an existing user from the platorm.
     * 
     * @param username the identifier of the user to remove
     */
    remove(username: string, callback?: (error: Error | null, removed?: boolean) => void): Promise<boolean> {
        return andCall(this.socket.request('DELETE', [Endpoints.USER, username])
            .then((res) => res.body.success), callback);
    }
}

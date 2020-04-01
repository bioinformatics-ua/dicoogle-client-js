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

export interface TaskInfo {
    /** the UUID of the task */
    taskUid: string
    /** a human readable task name */
    taskName: string
    /** a number between 0 and 1 representing the task's progress; any negative number means that no prediction is available */
    taskProgress: number
    /** whether the task is complete, assume not if not provided */
    complete?: boolean
    /** only if complete; the time elapsed while the task was running, in milliseconds */
    elapsedTime?: number
    /** only if complete; the number of files successfully indexed */
    nIndexed?: number
    /** only if complete; the number of indexing errors */
    nErrors?: number
}

export class Tasks {
  private _socket: Socket;

  constructor(socket) {
    /** @private */
    this._socket = socket;
  }

  /**
   * Obtain information about Dicoogle's running (or terminated) tasks.
   * @param {function(error:any, {tasks:TaskInfo[], count:number})} callback the callback function
   */
  public list(callback: (error: Error, outcome: {tasks: TaskInfo[], count: number}) => void) {
    this._socket.request('GET', Endpoints.TASKS)
        .type('application/json')
        .end(function(err, resp) {
            const {body} = resp;
            callback(err, body ? {
              tasks: body.results,
              count: body.count
            } : null);
        });
  }

  /**
   * Close a terminated task from the list of tasks.
   * @param uid the task's unique ID
   * @param callback the callback function
   */
  public close(uid: string, callback: (error: Error) => void) {
    this._socket.request('POST', Endpoints.TASKS).query({
          uid,
          action: 'delete',
          type: 'close'
        }).end(callback);
  }

  /**
   * Request that a task is stopped.
   * @param uid the task's unique ID
   * @param callback the callback function
   */
  public stop(uid: string, callback: (error: Error) => void) {
    this._socket.request('POST', Endpoints.TASKS).query({
          uid,
          action: 'delete',
          type: 'stop'
        }).end(callback);
  }

}

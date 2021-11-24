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
import {andCall, andCallVoid} from './util';

/** And entry describing a task in Dicoogle, which can be complete or in progress.
 */
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

export interface TaskOutcome {
  tasks: TaskInfo[],
  count: number,
}

export class Tasks {
  private _socket: Socket;

  constructor(socket) {
    this._socket = socket;
  }

  /**
   * Obtain information about Dicoogle's running (or terminated) tasks.
   * @param callback the callback function
   */
  public list(callback?: (error: Error, outcome: TaskOutcome) => void): Promise<TaskOutcome> {
    return andCall(this._socket.get(Endpoints.TASKS)
      .type('application/json')
      .then((resp) => {
        const {body} = resp;
        return body ? {
          tasks: body.results,
          count: body.count
        } : {
          tasks: [],
          count: 0
        };
      }), callback);
  }

  /**
   * Close a terminated task from the list of tasks.
   * @param uid the task's unique ID
   * @param callback the callback function
   */
  public close(uid: string, callback?: (error: Error) => void): Promise<void> {
    return andCallVoid(this._socket.post(Endpoints.TASKS).query({
      uid,
      action: 'delete',
      type: 'close'
    }), callback);
  }

  /**
   * Request that a task is stopped.
   * @param uid the task's unique ID
   * @param callback the callback function
   */
  public stop(uid: string, callback?: (error: Error) => void): Promise<void> {
    return andCallVoid(this._socket.post(Endpoints.TASKS).query({
      uid,
      action: 'delete',
      type: 'stop'
    }), callback);
  }
}

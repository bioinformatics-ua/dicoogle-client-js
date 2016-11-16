import Endpoints from './endpoints';

/** @typedef {Object} TaskInfo
 * @property {string} taskUid - the UUID of the task
 * @property {string} taskName - a human readable task name
 * @property {number} taskProgress - a number between 0 and 1 representing the task's progress; any negative number means no prediction is available
 * @property {boolean} [complete] - whether the task is complete, assume not if not available
 * @property {number} [elapsedTime] - only if complete; the time elapsed while the task was running
 * @property {number} [nIndexed] - the number of files successfully indexed
 * @property {number} [nErrors] - only if complete; the number of indexation errors
 */

export default class Tasks {

  constructor(socket) {
    /** @private */
    this._socket = socket;
  }

  /**
   * Obtain information about Dicoogle's running (or terminated) tasks.
   * @param {function(error:any, {tasks:TaskInfo[], count:number})} callback the callback function
   */
  list(callback) {
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
   * @param {string} uid the task's unique ID
   * @param {function(error:any)} callback the callback function
   */
  close(uid, callback) {
    this._socket.request('POST', Endpoints.TASKS).query({
          uid,
          action: 'delete',
          type: 'close'
        }).end(callback);
  }

  /**
   * Request that a task is stopped.
   * @param {string} uid the task's unique ID
   * @param {function(error:any)} callback the callback function
   */
  stop(uid, callback) {
    this._socket.request('POST', Endpoints.TASKS).query({
          uid,
          action: 'delete',
          type: 'stop'
        }).end(callback);
  }

}

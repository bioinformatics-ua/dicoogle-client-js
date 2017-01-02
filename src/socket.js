import superagent from 'superagent';
import Endpoints from './endpoints';

export default class Socket {

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

    login(username, password, callback) {

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
                this._username = data.user;
                this._roles = data.roles;
                if (typeof callback === 'function') {
                    callback(null, data);
                }
            });
    }

    restore(token, callback) {
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
                this._username = data.user;
                this._roles = data.roles;
                if (typeof callback === 'function') {
                    callback(null, data);
                }
            });
    }

    logout(callback) {
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
     * @private
     * @param {function(error:any)} callback the callback function
     */
    _logout_fallback(callback) {
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
     * @param {string} method - the intended HTTP method ('GET', 'POST', ...)
     * @param {string|string[]} uri - the URI to the intended service, relative to Dicoogle's base URL
     * @returns {SuperAgent} a superagent object for a new request to this service
     */
    request(method, uri) {
        return superagent(method, [this._url].concat(uri).join('/'))
                   .set('Authorization', this._token);
    }

    /** Create a GET request to Dicoogle.
     * @param {string|string[]} uri - the URI to the intended service, relative to Dicoogle's base URL
     * @returns {SuperAgent} a superagent object for a new request to this service
     */
    get(uri) {
        return this.request('GET', uri);
    }

    /** Create a POST request to Dicoogle.
     * @param {string|string[]} uri - the URI to the intended service, relative to Dicoogle's base URL
     * @returns {SuperAgent} a superagent object for a new request to this service
     */
    post(uri) {
        return this.request('POST', uri);
    }

    getToken() {
        return this._token;
    }

    setToken(token) {
        this._token = token;
    }

    getUsername() {
        return this._username;
    }

    getRoles() {
        return this._roles ? [].concat(this._roles) : null;
    }

    getBase() {
        return this._url;
    }

    hasToken() {
        return this._token !== null;
    }

    reset() {
        this._username = null;
        this._token = null;
        this._roles = null;
    }
}

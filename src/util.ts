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

/**
 * @param uid the UUID
 * @returns whether it's a DICOM UUID
 */
export function isDicomUUID(uid: string): boolean {
    return uid.length <= 64 && uid.match(/^\d+(\.\d+)*$/) !== null;
}

export function andCall<T>(promise: Promise<T>, callback: (error: any, outcome?: T) => void | undefined): Promise<T> {
    if (callback) {
        promise.then(
            (value) => callback(null, value),
            (err) => callback(err))
    }
    return promise;
}
  
export function andCallVoid(promise: Promise<any>, callback: (error: any) => void | undefined): Promise<void> {
    if (callback) {
        promise.then(
            () => callback(null),
            (err) => callback(err))
    }
    return promise;
}

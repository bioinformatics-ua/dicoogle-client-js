/**
 * @param {string} uid the UUID
 * @returns {boolean} whether it's a DICOM UUID
 */
export function isDicomUUID(uid) {
    return uid.match(/^\d+(\.\d+)*$/) !== null;
}

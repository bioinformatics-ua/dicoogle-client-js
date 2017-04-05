/**
 * @param uid the UUID
 * @returns whether it's a DICOM UUID
 */
export function isDicomUUID(uid: string): boolean {
    return uid.match(/^\d+(\.\d+)*$/) !== null;
}

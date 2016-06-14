'use strict';
/**
 * Determine whether a Bookshelf object is a Model.
 * @param data
 * @returns {boolean}
 */
function isModel(data) {
    if (!data) {
        return false;
    }
    else {
        return !isCollection(data);
    }
}
exports.isModel = isModel;
/**
 * Determine whether a Bookshelf object is a Collection.
 * @param data
 * @returns {boolean}
 */
function isCollection(data) {
    if (!data) {
        return false;
    }
    else {
        // Duck-typing
        return data.models !== undefined;
    }
}
exports.isCollection = isCollection;
//# sourceMappingURL=extras.js.map
'use strict';
var extras_1 = require('./extras');
var _ = require('lodash');
var links = require('./links');
/**
 * Builds the relationship transform schema.
 * @param baseUrl
 * @param modelType
 * @param relatedType
 * @param relatedKeys
 * @param included
 * @returns serializer.ISerializerOptions
 */
function buildRelation(baseUrl, modelType, relatedType, relatedKeys, included, disableLinks) {
    var r = {
        ref: 'id',
        attributes: relatedKeys,
        included: included
    };
    if (!disableLinks) {
        r.relationshipLinks = links.buildRelationship(baseUrl, modelType, relatedType);
        r.includedLinks = links.buildSelf(baseUrl, modelType, relatedType);
    }
    return r;
}
exports.buildRelation = buildRelation;
/**
 * Retrieves data's attributes list
 * omiting _id and _type attributes
 * @param data
 * @returns {string[]}
 */
function getDataAttributesList(data) {
    return _.keys(getDataAttributes(data)).filter(function (name) {
        return name !== 'id' &&
            !_.endsWith(name, '_id') &&
            !_.endsWith(name, '_type');
    });
}
exports.getDataAttributesList = getDataAttributesList;
/**
 * Retrieves data's attributes
 * @param data
 * @returns {any}
 * @private
 */
function getDataAttributes(data) {
    // Undefined case
    if (!data)
        return {};
    // Model Case
    if (extras_1.isModel(data)) {
        var m = data;
        return m.attributes;
    }
    else if (extras_1.isCollection(data)) {
        var c = data;
        return c.models[0] && c.models[0].attributes;
    }
}
exports.getDataAttributes = getDataAttributes;
/**
 * Convert a bookshelf model or collection to
 * json adding the id attribute if missing
 * @param data
 * @returns {any}
 */
function toJSON(data) {
    var json = (data && data.toJSON()) || null;
    // Nothing to convert
    if (_.isNull(json)) {
        return json;
    }
    else if (extras_1.isModel(data)) {
        // Assign the id for the model if it's not present already
        if (!_.has(json, 'id')) {
            json.id = data.id;
        }
        // Loop over model relations to call toJSON recursively on them
        _.forOwn(data.relations, function (rel, relName) {
            json[relName] = toJSON(rel);
        });
    }
    else if (extras_1.isCollection(data)) {
        // Run a recursive toJSON on each model of the collection
        for (var index = 0; index < data.length; ++index) {
            json[index] = toJSON(data.models[index]);
        }
    }
    return json;
}
exports.toJSON = toJSON;
//# sourceMappingURL=utils.js.map
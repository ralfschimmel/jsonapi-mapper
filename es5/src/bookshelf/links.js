'use strict';
var _ = require('lodash');
var inflection = require('inflection');
var Qs = require('qs');
var extras_1 = require('./extras');
/**
 * Generates the top level links object.
 * @param baseUrl
 * @param type
 * @param query
 * @param pag
 * @returns any TODO LINKS OBJECT
 */
function buildTop(baseUrl, type, pag, query) {
    var obj = {
        self: baseUrl + '/' + inflection.pluralize(type)
    };
    // Only build pagination if pagination data was passed.
    if (pag) {
        // Support Bookshelf's built-in paging parameters
        if (pag.rowCount)
            pag.total = pag.rowCount;
        // Add pagination if total records is greater than 0
        // and total records is less than limit.
        if (pag.total > 0 && pag.total > pag.limit) {
            _.assign(obj, buildPagination(baseUrl, type, pag, query));
        }
    }
    return obj;
}
exports.buildTop = buildTop;
/**
 * Generates pagination links for a collection.
 * @param baseUrl
 * @param type
 * @param pag
 * @param query
 * @returns any TODO PAGINATION LINKS OBJECT
 */
function buildPagination(baseUrl, type, pag, query) {
    if (query === void 0) { query = {}; }
    var baseLink = baseUrl + '/' + inflection.pluralize(type);
    query = _.omit(query, 'page');
    var queryStr = Qs.stringify(query, { encode: false });
    var pagingLinks = {};
    if (pag.offset > 0) {
        pagingLinks.first = function () {
            return baseLink +
                '?page[limit]=' + pag.limit +
                '&page[offset]=0' +
                queryStr;
        };
        pagingLinks.prev = function () {
            return baseLink +
                '?page[limit]=' + pag.limit +
                '&page[offset]=' + (pag.offset - pag.limit) +
                queryStr;
        };
    }
    if (pag.total && (pag.offset + pag.limit < pag.total)) {
        pagingLinks.next = function (collection) {
            return baseLink +
                '?page[limit]=' + pag.limit +
                '&page[offset]=' + (pag.offset + pag.limit) +
                queryStr;
        };
        pagingLinks.last = function () {
            return baseLink +
                '?page[limit]=' + pag.limit +
                '&page[offset]=' + (pag.total - pag.limit) +
                queryStr;
        };
    }
    return !_.isEmpty(pagingLinks) ? pagingLinks : undefined;
}
exports.buildPagination = buildPagination;
/**
 * Generates the resource's url.
 * @param baseUrl
 * @param modelType
 * @param query
 * @returns {{self: (function(any, any): string)}}
 */
function buildSelf(baseUrl, modelType, relatedType, query) {
    return {
        self: function (parent, current) {
            var type = relatedType || modelType;
            var link = baseUrl + '/' +
                inflection.pluralize(type);
            // If a model
            if (extras_1.isModel(current)) {
                return link + '/' + current.id; // TODO ADD QUERY PARAMS AND PAGINATION
            }
            else if (extras_1.isCollection(current)) {
                return link;
            }
        }
    };
}
exports.buildSelf = buildSelf;
/**
 * Generates the relationship links inside the primary resource
 * @param baseUrl
 * @param modelType
 * @param relatedType
 * @param query
 * @returns {{self: (function(Data): string), related: (function(Data): string)}}
 */
function buildRelationship(baseUrl, modelType, relatedType, query) {
    return {
        self: function (model, related) {
            var data = model[modelType] || model;
            var link = baseUrl + '/' +
                inflection.pluralize(modelType);
            // Primary data is expected to be a model
            link += '/' + data.id;
            // Add relationship url component
            link += '/relationships/' + relatedType;
            return link;
        },
        related: function (model, related) {
            var data = model[modelType] || model;
            var link = baseUrl + '/' +
                inflection.pluralize(modelType);
            // Primary data is expected to be a model
            link += '/' + data.id;
            // Add relationship url component
            link += '/' + relatedType;
            return link;
        }
    };
}
exports.buildRelationship = buildRelationship;
//# sourceMappingURL=links.js.map
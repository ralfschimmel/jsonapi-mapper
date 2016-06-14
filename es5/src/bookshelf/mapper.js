'use strict';
var _ = require('lodash');
var jsonapi_serializer_1 = require('jsonapi-serializer');
var tc = require('type-check');
var extras_1 = require('./extras');
var links = require('./links');
var utils = require('./utils');
var typeCheck = tc.typeCheck;
var Bookshelf = (function () {
    /**
     * Default constructor
     * @param baseUrl
     * @param serializerOptions
     */
    function Bookshelf(baseUrl, serializerOptions) {
        this.baseUrl = baseUrl;
        this.serializerOptions = serializerOptions;
    }
    /**
     * Recursively add all the (nested) relations to the template
     * @param data
     * @param type
     * @param bookshelfOptions
     * @param template
     */
    Bookshelf.prototype.mapRelations = function (model, type, bookshelfOptions, template) {
        if (bookshelfOptions === void 0) { bookshelfOptions = { relations: true }; }
        var self = this;
        _.forOwn(model.relations, function (relModel, relName) {
            // Skip if the relation is not permitted
            if (bookshelfOptions.relations === false ||
                (typeCheck('[String]', bookshelfOptions.relations) &&
                    bookshelfOptions.relations.indexOf(relName) < 0)) {
                return;
            }
            // Avoid duplicates
            if (!_.includes(template.attributes, relName)) {
                // Add relation to attribute list
                template.attributes.push(relName);
            }
            // Apply relation attributes
            if (template[relName] === undefined || _.isEmpty(template[relName].attributes)) {
                // Add relation serialization
                template[relName] = utils.buildRelation(self.baseUrl, type, relName, utils.getDataAttributesList(relModel), true);
            }
            // recurse to add nested relations
            self.mapRelations(relModel, relName, bookshelfOptions, template[relName]);
        });
    };
    /**
     * Maps bookshelf data to a JSON-API 1.0 compliant object
     * @param data
     * @param type
     * @param bookshelfOptions
     * @returns {"jsonapi-serializer".Serializer}
     */
    Bookshelf.prototype.map = function (data, type, bookshelfOptions) {
        // TODO ADD meta property of serializerOptions TO template
        if (bookshelfOptions === void 0) { bookshelfOptions = { relations: true }; }
        var self = this;
        var template = {};
        // Build links objects
        template.topLevelLinks = links.buildTop(self.baseUrl, type, bookshelfOptions.pagination, bookshelfOptions.query);
        template.dataLinks = links.buildSelf(self.baseUrl, type, null, bookshelfOptions.query);
        // Serializer process for a Model
        if (extras_1.isModel(data)) {
            // Add list of valid attributes
            template.attributes = utils.getDataAttributesList(data);
            // Provide support for withRelated option TODO WARNING DEPRECATED. To be deleted on next major version
            if (bookshelfOptions.includeRelations)
                bookshelfOptions.relations = bookshelfOptions.includeRelations;
            // Add relations (only if permitted)
            if (bookshelfOptions.relations) {
                self.mapRelations(data, type, bookshelfOptions, template);
            }
        }
        else if (extras_1.isCollection(data)) {
            var model = data.first();
            if (!_.isUndefined(model)) {
                // Add list of valid attributes
                template.attributes = utils.getDataAttributesList(model);
                // Provide support for withRelated option TODO WARNING DEPRECATED. To be deleted on next major version
                if (bookshelfOptions.includeRelations)
                    bookshelfOptions.relations = bookshelfOptions.includeRelations;
                data.forEach(function (model) {
                    self.mapRelations(model, type, bookshelfOptions, template);
                });
            }
        }
        // Override the template with the provided serializer options
        _.assign(template, this.serializerOptions);
        // Return the data in JSON API format
        var json = utils.toJSON(data);
        return new jsonapi_serializer_1.Serializer(type, template).serialize(json);
    };
    return Bookshelf;
}());
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Bookshelf;
//# sourceMappingURL=mapper.js.map
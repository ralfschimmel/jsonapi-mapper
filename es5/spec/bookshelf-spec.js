'use strict';
var _ = require('lodash');
var bs = require('bookshelf');
var knex = require('knex');
var Mapper = require('../src/mapper');
describe('Bookshelf Adapter', function () {
    var bookshelf;
    var mapper;
    var domain = 'https://domain.com';
    beforeAll(function () {
        bookshelf = bs(knex({}));
        mapper = new Mapper.Bookshelf(domain);
    });
    afterAll(function (done) {
        bookshelf.knex.destroy(done);
    });
    it('should serialize a basic model', function () {
        var model = bookshelf.Model.forge({
            id: '5',
            name: 'A test model',
            description: 'something to use as a test'
        });
        var result = mapper.map(model, 'models');
        var expected = {
            data: {
                id: '5',
                type: 'models',
                attributes: {
                    name: 'A test model',
                    description: 'something to use as a test'
                }
            }
        };
        expect(_.matches(expected)(result)).toBe(true);
    });
    it('should serialize a basic model with custom id attribute', function () {
        var CustomModel = bookshelf.Model.extend({
            idAttribute: 'email'
        });
        var model = CustomModel.forge({
            email: 'foo@example.com',
            name: 'A test model',
            description: 'something to use as a test'
        });
        var result = mapper.map(model, 'models');
        var expected = {
            data: {
                id: 'foo@example.com',
                type: 'models',
                attributes: {
                    email: 'foo@example.com',
                    name: 'A test model',
                    description: 'something to use as a test'
                }
            }
        };
        expect(_.matches(expected)(result)).toBe(true);
    });
    it('should serialize related model with custom id attribute in relationships object', function () {
        var CustomModel = bookshelf.Model.extend({
            idAttribute: 'email'
        });
        var model = bookshelf.Model.forge({
            id: 5,
            name: 'A test model',
            description: 'something to use as a test'
        });
        model.relations['related-model'] = CustomModel.forge({
            email: 'foo@example.com',
            attr2: 'value2'
        });
        var result = mapper.map(model, 'models');
        var expected = {
            data: {
                relationships: {
                    'related-model': {
                        data: {
                            id: 'foo@example.com',
                            type: 'related-models' // TODO check correct casing
                        },
                        links: {
                            self: domain + '/models/' + '5' + '/relationships/' + 'related-model',
                            related: domain + '/models/' + '5' + '/related-model'
                        }
                    }
                }
            }
        };
        expect(_.matches(expected)(result)).toBe(true);
    });
    it('should serialize related model with custom id attribute in included array', function () {
        var CustomModel = bookshelf.Model.extend({
            idAttribute: 'email'
        });
        var model = bookshelf.Model.forge({
            id: 5,
            name: 'A test model',
            description: 'something to use as a test'
        });
        model.relations['related-model'] = CustomModel.forge({
            email: 'foo@example.com',
            attr2: 'value2'
        });
        var result = mapper.map(model, 'models');
        var expected = {
            included: [
                {
                    id: 'foo@example.com',
                    type: 'related-models',
                    attributes: {
                        email: 'foo@example.com',
                        attr2: 'value2'
                    }
                }
            ]
        };
        expect(_.matches(expected)(result)).toBe(true);
    });
    it('should serialize a collection with custom id attribute', function () {
        var CustomModel = bookshelf.Model.extend({
            idAttribute: 'email'
        });
        var CustomCollection = bookshelf.Collection.extend({
            model: CustomModel
        });
        var model1 = CustomModel.forge({
            email: 'foo@example.com',
            name: 'A test model1',
            description: 'something to use as a test'
        });
        var collection = bookshelf.Collection.forge([model1]);
        var result = mapper.map(collection, 'models');
        var expected = {
            data: [
                {
                    id: 'foo@example.com',
                    type: 'models',
                    attributes: {
                        email: 'foo@example.com',
                        name: 'A test model1',
                        description: 'something to use as a test'
                    }
                }
            ]
        };
        expect(_.matches(expected)(result)).toBe(true);
    });
    it('should serialize a collection with custom id attribute within a related model on relationships object', function () {
        var CustomModel = bookshelf.Model.extend({
            idAttribute: 'email'
        });
        var CustomCollection = bookshelf.Collection.extend({
            model: CustomModel
        });
        var model = bookshelf.Model.forge({
            id: 5,
            name: 'A test model',
            description: 'something to use as a test'
        });
        model.relations['related-model'] = CustomModel.forge({
            email: 'foo@example.com',
            attr2: 'value2'
        });
        var collection = bookshelf.Collection.forge([model]);
        var result = mapper.map(collection, 'models');
        var expected = {
            data: [
                {
                    type: 'models',
                    id: '5',
                    attributes: {
                        name: 'A test model',
                        description: 'something to use as a test'
                    },
                    links: { self: 'https://domain.com/models/5' },
                    relationships: {
                        'related-model': {
                            data: { id: 'foo@example.com', type: 'related-models' },
                            links: {
                                self: 'https://domain.com/models/5/relationships/related-model',
                                related: 'https://domain.com/models/5/related-model'
                            }
                        }
                    }
                }
            ]
        };
        expect(_.matches(expected)(result)).toBe(true);
    });
    it('should serialize a collection with custom id attribute within a related model on included array', function () {
        var CustomModel = bookshelf.Model.extend({
            idAttribute: 'email'
        });
        var CustomCollection = bookshelf.Collection.extend({
            model: CustomModel
        });
        var model = bookshelf.Model.forge({
            id: 5,
            name: 'A test model',
            description: 'something to use as a test'
        });
        model.relations['related-model'] = CustomModel.forge({
            email: 'foo@example.com',
            attr2: 'value2'
        });
        var collection = bookshelf.Collection.forge([model]);
        var result = mapper.map(collection, 'models');
        var expected = {
            included: [
                {
                    type: 'related-models',
                    id: 'foo@example.com',
                    attributes: {
                        email: 'foo@example.com',
                        attr2: 'value2'
                    },
                    links: { self: 'https://domain.com/related-models/foo@example.com' },
                }
            ]
        };
        expect(_.matches(expected)(result)).toBe(true);
    });
    it('should serialize null or undefined data', function () {
        var result1 = mapper.map(undefined, 'models');
        var result2 = mapper.map(null, 'models');
        var expected = {
            data: null
        };
        expect(_.matches(expected)(result1)).toBe(true);
        expect(_.matches(expected)(result2)).toBe(true);
    });
    it('should not add the id to the attributes', function () {
        var model = bookshelf.Model.forge({ id: '5' });
        var result = mapper.map(model, 'models');
        expect(_.has(result, 'data.attributes.id')).toBe(false);
    });
    it('should ignore any *_id attribute on the attributes', function () {
        var model = bookshelf.Model.forge({
            id: '4',
            attr: 'value',
            'related_id': 123,
            'another_id': '456'
        });
        var result = mapper.map(model, 'models');
        var expected = {
            data: {
                id: '4',
                type: 'models',
                attributes: {
                    attr: 'value'
                }
            }
        };
        expect(_.matches(expected)(result)).toBe(true);
        expect(_.isEqual(result.data.attributes, expected.data.attributes)).toBe(true);
    });
    it('should ignore any *_type attribute on the attributes', function () {
        var model = bookshelf.Model.forge({
            id: '4',
            attr: 'value',
            'related_type': 'normal'
        });
        var result = mapper.map(model, 'models');
        var expected = {
            data: {
                id: '4',
                type: 'models',
                attributes: {
                    attr: 'value'
                }
            }
        };
        expect(_.matches(expected)(result)).toBe(true);
        expect(_.isEqual(result.data.attributes, expected.data.attributes)).toBe(true);
    });
    it('should serialize an empty collection', function () {
        var collection = bookshelf.Collection.forge();
        var result = mapper.map(collection, 'models');
        var expected = {
            data: []
        };
        expect(_.matches(expected)(result)).toBe(true);
    });
    it('should serialize a collection', function () {
        var elements = _.range(5).map(function (num) {
            return bookshelf.Model.forge({ id: num, attr: 'value' + num });
        });
        var collection = bookshelf.Collection.forge(elements);
        var result = mapper.map(collection, 'models');
        var expected = {
            data: _.range(5).map(function (num) {
                return {
                    id: num.toString(),
                    type: 'models',
                    attributes: {
                        attr: 'value' + num
                    }
                };
            })
        };
        expect(_.matches(expected)(result)).toBe(true);
    });
});
describe('Bookshelf links', function () {
    var bookshelf;
    var mapper;
    var domain = 'https://domain.com';
    beforeAll(function () {
        bookshelf = bs(knex({}));
        mapper = new Mapper.Bookshelf(domain);
    });
    afterAll(function (done) {
        bookshelf.knex.destroy(done);
    });
    it('should add top level links', function () {
        var model = bookshelf.Model.forge({ id: '10' });
        var result = mapper.map(model, 'models');
        var expected = {
            data: {
                id: '10',
                type: 'models'
            },
            links: {
                self: domain + '/models'
            }
        };
        expect(_.matches(expected)(result)).toBe(true);
    });
    it('should add primary data links', function () {
        var model = bookshelf.Model.forge({ id: '5' });
        var result = mapper.map(model, 'models');
        var expected = {
            data: {
                id: '5',
                type: 'models',
                links: {
                    self: domain + '/models' + '/5'
                }
            }
        };
        expect(_.matches(expected)(result)).toBe(true);
    });
    it('should add related links', function () {
        var model = bookshelf.Model.forge({ id: '5' });
        model.relations['related-model'] = bookshelf.Model.forge({ id: '10' });
        var result = mapper.map(model, 'models');
        var expected = {
            data: {
                relationships: {
                    'related-model': {
                        data: {
                            id: '10',
                            type: 'related-models' // TODO check correct casing
                        },
                        links: {
                            self: domain + '/models/' + '5' + '/relationships/' + 'related-model',
                            related: domain + '/models/' + '5' + '/related-model'
                        }
                    }
                }
            }
        };
        expect(_.matches(expected)(result)).toBe(true);
    });
    it('should add related links for nested relationships', function () {
        var model1 = bookshelf.Model.forge({ id: '5', attr: 'value' });
        var model2 = bookshelf.Model.forge({ id: '6', attr: 'value' });
        var model3 = bookshelf.Model.forge({ id: '7', attr: 'value' });
        model1.relations['related-model'] = model2;
        model2.relations['nested-related-model'] = model3;
        var result = mapper.map(model1, 'models');
        var expected = {
            included: [
                {
                    id: '6',
                    type: 'related-models',
                    attributes: {
                        attr: 'value'
                    },
                    relationships: {
                        'nested-related-model': {
                            data: {
                                type: 'nested-related-models',
                                id: '7'
                            },
                            links: {
                                self: domain + "/related-models/6/relationships/nested-related-model",
                                related: domain + "/related-models/6/nested-related-model"
                            }
                        }
                    }
                },
                {
                    id: '7',
                    type: 'nested-related-models',
                    attributes: {
                        attr: 'value'
                    }
                }
            ],
            data: {
                relationships: {
                    'related-model': {
                        data: {
                            type: 'related-models',
                            id: '6'
                        }
                    }
                }
            }
        };
        expect(_.matches(expected)(result)).toBe(true);
    });
    it('should add related links for nested relationships within a collection', function () {
        var model1 = bookshelf.Model.forge({ id: '5', attr: 'value' });
        var model2 = bookshelf.Model.forge({ id: '6', attr: 'value' });
        model1.relations['related-model'] = model2;
        model2.relations['nested-related-models'] = bookshelf.Collection.forge([
            bookshelf.Model.forge({ id: '10', attr: 'value' }),
            bookshelf.Model.forge({ id: '11', attr: 'value' })
        ]);
        var collection = bookshelf.Collection.forge([model1]);
        var result = mapper.map(collection, 'models');
        var expected = {
            included: [
                {
                    id: '6',
                    type: 'related-models',
                    attributes: {
                        attr: 'value'
                    },
                    relationships: {
                        'nested-related-models': {
                            data: [{
                                    type: 'nested-related-models',
                                    id: '10'
                                }, {
                                    type: 'nested-related-models',
                                    id: '11'
                                }],
                            links: {
                                self: domain + "/related-models/6/relationships/nested-related-models",
                                related: domain + "/related-models/6/nested-related-models"
                            }
                        }
                    }
                },
                {
                    id: '10',
                    type: 'nested-related-models',
                    attributes: {
                        attr: 'value'
                    }
                },
                {
                    id: '11',
                    type: 'nested-related-models',
                    attributes: {
                        attr: 'value'
                    }
                }
            ],
            data: [{
                    relationships: {
                        'related-model': {
                            data: {
                                type: 'related-models',
                                id: '6'
                            }
                        }
                    }
                }]
        };
        expect(_.matches(expected)(result)).toBe(true);
    });
    it('should add pagination links', function () {
        var limit = 10;
        var offset = 40;
        var total = 100;
        var elements = _.range(10).map(function (num) {
            return bookshelf.Model.forge({ id: num, attr: 'value' + num });
        });
        var collection = bookshelf.Collection.forge(elements);
        var result = mapper.map(collection, 'models', {
            pagination: {
                limit: limit,
                offset: offset,
                total: total
            }
        });
        var expected = {
            links: {
                first: domain + '/models?page[limit]=' + limit + '&page[offset]=' + 0,
                prev: domain + '/models?page[limit]=' + limit + '&page[offset]=' + (offset - limit),
                next: domain + '/models?page[limit]=' + limit + '&page[offset]=' + (offset + limit),
                last: domain + '/models?page[limit]=' + limit + '&page[offset]=' + (total - limit)
            }
        };
        expect(_.matches(expected)(result)).toBe(true);
    });
    it('should not add pagination links if no pagination data is passed', function () {
        var limit = 10;
        var offset = 40;
        var total = 100;
        var elements = _.range(10).map(function (num) {
            return bookshelf.Model.forge({ id: num, attr: 'value' + num });
        });
        var collection = bookshelf.Collection.forge(elements);
        var result = mapper.map(collection, 'models');
        expect(result.links).toBeDefined();
        expect(Object.keys(result.links)).not.toContain('prev');
        expect(Object.keys(result.links)).not.toContain('first');
        expect(Object.keys(result.links)).not.toContain('next');
        expect(Object.keys(result.links)).not.toContain('last');
    });
    it('should support bookshelf\'s new `rowCount` property passed by `Model#fetchPage`', function () {
        var limit = 10;
        var offset = 40;
        var total = 100;
        var elements = _.range(10).map(function (num) {
            return bookshelf.Model.forge({ id: num, attr: 'value' + num });
        });
        var collection = bookshelf.Collection.forge(elements);
        var result = mapper.map(collection, 'models', {
            pagination: {
                limit: limit,
                offset: offset,
                rowCount: total
            }
        });
        var expected = {
            links: {
                first: domain + '/models?page[limit]=' + limit + '&page[offset]=' + 0,
                prev: domain + '/models?page[limit]=' + limit + '&page[offset]=' + (offset - limit),
                next: domain + '/models?page[limit]=' + limit + '&page[offset]=' + (offset + limit),
                last: domain + '/models?page[limit]=' + limit + '&page[offset]=' + (total - limit)
            }
        };
        expect(_.matches(expected)(result)).toBe(true);
    });
    it('should omit `first` and `prev` pagination links if offset = 0', function () {
        var limit = 5;
        var offset = 0;
        var total = 10;
        var collection = bookshelf.Collection.forge([]);
        var result = mapper.map(collection, 'models', {
            pagination: {
                limit: limit,
                offset: offset,
                total: total
            }
        });
        expect(result.links).toBeDefined();
        expect(Object.keys(result.links)).not.toContain('first');
        expect(Object.keys(result.links)).not.toContain('prev');
        expect(Object.keys(result.links)).toContain('next');
        expect(Object.keys(result.links)).toContain('last');
    });
    it('should omit `next` and `last` pagination links if at last page', function () {
        var limit = 5;
        var offset = 5;
        var total = 10;
        var collection = bookshelf.Collection.forge([]);
        var result = mapper.map(collection, 'models', {
            pagination: {
                limit: limit,
                offset: offset,
                total: total
            }
        });
        expect(result.links).toBeDefined();
        expect(Object.keys(result.links)).toContain('first');
        expect(Object.keys(result.links)).toContain('prev');
        expect(Object.keys(result.links)).not.toContain('next');
        expect(Object.keys(result.links)).not.toContain('last');
    });
    it('should not add pagination links if collection is empty', function () {
        var limit = 10;
        var offset = 40;
        var total = 0;
        var collection = bookshelf.Collection.forge([]);
        var result = mapper.map(collection, 'models', {
            pagination: {
                limit: limit,
                offset: offset,
                total: total
            }
        });
        expect(result.links).toBeDefined();
        expect(Object.keys(result.links)).not.toContain('prev');
        expect(Object.keys(result.links)).not.toContain('first');
        expect(Object.keys(result.links)).not.toContain('next');
        expect(Object.keys(result.links)).not.toContain('last');
    });
    it('should not add pagination links if total <= limit', function () {
        var limit = 10;
        var offset = 0;
        var total = 5;
        var elements = _.range(total).map(function (num) {
            return bookshelf.Model.forge({ id: num, attr: 'value' + num });
        });
        var collection = bookshelf.Collection.forge(elements);
        var result = mapper.map(collection, 'models', {
            pagination: {
                limit: limit,
                offset: offset,
                total: total
            }
        });
        expect(result.links).toBeDefined();
        expect(Object.keys(result.links)).not.toContain('prev');
        expect(Object.keys(result.links)).not.toContain('first');
        expect(Object.keys(result.links)).not.toContain('next');
        expect(Object.keys(result.links)).not.toContain('last');
    });
    it('does not serialize links when `disableLinks: true`', function () {
        var model1 = bookshelf.Model.forge({ id: '5', attr: 'value' });
        var model2 = bookshelf.Model.forge({ id: '6', attr: 'value' });
        model1.relations['related-model'] = model2;
        model2.relations['nested-related-models'] = bookshelf.Collection.forge([
            bookshelf.Model.forge({ id: '10', attr: 'value' })
        ]);
        var collection = bookshelf.Collection.forge([model1]);
        var result = mapper.map(collection, 'models', { disableLinks: true });
        expect(result.links).not.toBeDefined();
        expect(result.data[0].relationships['related-model'].links).not.toBeDefined();
        expect(result.included[0].links).not.toBeDefined();
        expect(result.included[1].links).not.toBeDefined();
    });
});
describe('Bookshelf relations', function () {
    var bookshelf;
    var mapper;
    var domain = 'https://domain.com';
    beforeAll(function () {
        bookshelf = bs(knex({}));
        mapper = new Mapper.Bookshelf(domain);
    });
    afterAll(function (done) {
        bookshelf.knex.destroy(done);
    });
    it('should add relationships object', function () {
        var model = bookshelf.Model.forge({ id: '5', attr: 'value' });
        model.relations['related-model'] = bookshelf.Model.forge({ id: '10', attr2: 'value2' });
        model.relations['related-model']
            .relations['inner-related-model'] = bookshelf.Model.forge({ id: '20', attr3: 'value3' });
        var result = mapper.map(model, 'model');
        var expected = {
            data: {
                id: '5',
                type: 'models',
                attributes: {
                    attr: 'value'
                },
                relationships: {
                    'related-model': {
                        data: {
                            id: '10',
                            type: 'related-models'
                        }
                    }
                }
            },
            included: [
                {
                    type: 'related-models',
                    id: '10',
                    attributes: {
                        attr2: 'value2'
                    },
                    relationships: {
                        'inner-related-model': {
                            data: {
                                id: '20',
                                type: 'inner-related-models'
                            }
                        }
                    }
                },
                {
                    type: 'inner-related-models',
                    id: '20',
                    attributes: {
                        attr3: 'value3'
                    }
                }
            ]
        };
        expect(_.matches(expected)(result)).toBe(true);
    });
    it('should put the single related object in the included array', function () {
        var model = bookshelf.Model.forge({ id: '5', atrr: 'value' });
        model.relations['related-model'] = bookshelf.Model.forge({ id: '10', attr2: 'value2' });
        var result = mapper.map(model, 'models');
        var expected = {
            included: [
                {
                    id: '10',
                    type: 'related-models',
                    attributes: {
                        attr2: 'value2'
                    }
                }
            ]
        };
        expect(_.matches(expected)(result)).toBe(true);
    });
    it('should return empty array when collection is empty', function () {
        var collection = bookshelf.Collection.forge([]);
        var result = mapper.map(collection, 'models');
        var expected = {
            data: []
        };
        expect(_.matches(expected)(result)).toBe(true);
    });
    it('should put the array of related objects in the included array', function () {
        var model1 = bookshelf.Model.forge({ id: '5', atrr: 'value' });
        model1.relations['related-models'] = bookshelf.Collection.forge([
            bookshelf.Model.forge({ id: '10', attr2: 'value20' }),
            bookshelf.Model.forge({ id: '11', attr2: 'value21' })
        ]);
        var model2 = bookshelf.Model.forge({ id: '6', atrr: 'value' });
        model2.relations['related-models'] = bookshelf.Collection.forge([
            bookshelf.Model.forge({ id: '12', attr2: 'value22' }),
            bookshelf.Model.forge({ id: '13', attr2: 'value23' })
        ]);
        var collection = bookshelf.Collection.forge([model1, model2]);
        var result = mapper.map(collection, 'models');
        var expected = {
            included: [
                {
                    id: '10',
                    type: 'related-models',
                    attributes: {
                        attr2: 'value20'
                    }
                },
                {
                    id: '11',
                    type: 'related-models',
                    attributes: {
                        attr2: 'value21'
                    }
                },
                {
                    id: '12',
                    type: 'related-models',
                    attributes: {
                        attr2: 'value22'
                    }
                },
                {
                    id: '13',
                    type: 'related-models',
                    attributes: {
                        attr2: 'value23'
                    }
                }
            ]
        };
        expect(_.matches(expected)(result)).toBe(true);
    });
    it('should put the array of related objects in the included array with different related', function () {
        var model1 = bookshelf.Model.forge({ id: '5', atrr: 'value' });
        model1.relations['related1-models'] = bookshelf.Collection.forge([
            bookshelf.Model.forge({ id: '10', attr2: 'value20' }),
            bookshelf.Model.forge({ id: '11', attr2: 'value21' })
        ]);
        var model2 = bookshelf.Model.forge({ id: '6', atrr: 'value' });
        model2.relations['related2-models'] = bookshelf.Collection.forge([
            bookshelf.Model.forge({ id: '12', attr2: 'value22' }),
            bookshelf.Model.forge({ id: '13', attr2: 'value23' })
        ]);
        var collection = bookshelf.Collection.forge([model1, model2]);
        var result = mapper.map(collection, 'models');
        var expected = {
            included: [
                {
                    id: '10',
                    type: 'related1-models',
                    attributes: {
                        attr2: 'value20'
                    }
                },
                {
                    id: '11',
                    type: 'related1-models',
                    attributes: {
                        attr2: 'value21'
                    }
                },
                {
                    id: '12',
                    type: 'related2-models',
                    attributes: {
                        attr2: 'value22'
                    }
                },
                {
                    id: '13',
                    type: 'related2-models',
                    attributes: {
                        attr2: 'value23'
                    }
                }
            ]
        };
        expect(_.matches(expected)(result)).toBe(true);
    });
    it('should support including nested relationships', function () {
        var model1 = bookshelf.Model.forge({ id: '5', attr: 'value' });
        var model2 = bookshelf.Model.forge({ id: '6', attr: 'value' });
        var model3 = bookshelf.Model.forge({ id: '7', attr: 'value' });
        model1.relations['related-model'] = model2;
        model2.relations['nested-related-model'] = model3;
        var result = mapper.map(model1, 'models');
        var expected = {
            included: [
                {
                    id: '6',
                    type: 'related-models',
                    attributes: {
                        attr: 'value'
                    },
                    relationships: {
                        'nested-related-model': {
                            data: {
                                type: 'nested-related-models',
                                id: '7'
                            }
                        }
                    }
                },
                {
                    id: '7',
                    type: 'nested-related-models',
                    attributes: {
                        attr: 'value'
                    }
                }
            ],
            data: {
                relationships: {
                    'related-model': {
                        data: {
                            type: 'related-models',
                            id: '6'
                        }
                    }
                }
            }
        };
        expect(_.matches(expected)(result)).toBe(true);
    });
    it('should support including nested relationships when acting on a collection', function () {
        var model1 = bookshelf.Model.forge({ id: '5', attr: 'value' });
        var model2 = bookshelf.Model.forge({ id: '6', attr: 'value' });
        model1.relations['related-model'] = model2;
        model2.relations['nested-related-models'] = bookshelf.Collection.forge([
            bookshelf.Model.forge({ id: '10', attr: 'value' }),
            bookshelf.Model.forge({ id: '11', attr: 'value' })
        ]);
        var collection = bookshelf.Collection.forge([model1]);
        var result = mapper.map(collection, 'models');
        var expected = {
            included: [
                {
                    id: '6',
                    type: 'related-models',
                    attributes: {
                        attr: 'value'
                    },
                    relationships: {
                        'nested-related-models': {
                            data: [{
                                    type: 'nested-related-models',
                                    id: '10'
                                }, {
                                    type: 'nested-related-models',
                                    id: '11'
                                }]
                        }
                    }
                },
                {
                    id: '10',
                    type: 'nested-related-models',
                    attributes: {
                        attr: 'value'
                    }
                },
                {
                    id: '11',
                    type: 'nested-related-models',
                    attributes: {
                        attr: 'value'
                    }
                }
            ],
            data: [{
                    relationships: {
                        'related-model': {
                            data: {
                                type: 'related-models',
                                id: '6'
                            }
                        }
                    }
                }]
        };
        expect(_.matches(expected)(result)).toBe(true);
    });
    it('should put the array of related objects in the included array with proper attributes even if relation is empty', function () {
        var model1 = bookshelf.Model.forge({ id: '5', atrr: 'value' });
        model1.relations['related-models'] = bookshelf.Collection.forge();
        var model2 = bookshelf.Model.forge({ id: '6', atrr: 'value' });
        model2.relations['related-models'] = bookshelf.Collection.forge([
            bookshelf.Model.forge({ id: '12', attr2: 'value22' }),
            bookshelf.Model.forge({ id: '13', attr2: 'value23' })
        ]);
        var collection = bookshelf.Collection.forge([model1, model2]);
        var result = mapper.map(collection, 'models');
        var expected = {
            included: [
                {
                    id: '12',
                    type: 'related-models',
                    attributes: {
                        attr2: 'value22'
                    }
                },
                {
                    id: '13',
                    type: 'related-models',
                    attributes: {
                        attr2: 'value23'
                    }
                }
            ]
        };
        expect(_.matches(expected)(result)).toBe(true);
    });
    it('should give an option to ignore relations', function () {
        var model = bookshelf.Model.forge({ id: '5', atrr: 'value' });
        model.relations['related-models'] = bookshelf.Collection.forge([
            bookshelf.Model.forge({ id: '10', attr2: 'value20' }),
            bookshelf.Model.forge({ id: '11', attr2: 'value21' })
        ]);
        var result1 = mapper.map(model, 'models', { relations: true });
        var result2 = mapper.map(model, 'models', { relations: false });
        var expected1 = {
            included: [
                {
                    id: '10',
                    type: 'related-models',
                    attributes: {
                        attr2: 'value20'
                    }
                },
                {
                    id: '11',
                    type: 'related-models',
                    attributes: {
                        attr2: 'value21'
                    }
                }
            ]
        };
        expect(_.matches(expected1)(result1)).toBe(true);
        expect(_.has(result2, 'data.relationships.related-models')).toBe(false);
        expect(_.has(result2, 'included')).toBe(false);
    });
    it('should give an option to choose which relations to add', function () {
        var model = bookshelf.Model.forge({ id: '5', atrr: 'value' });
        model.relations['related-one'] = bookshelf.Model.forge({ id: '10', attr1: 'value1' });
        model.relations['related-two'] = bookshelf.Model.forge({ id: '20', attr2: 'value2' });
        var result = mapper.map(model, 'models', { relations: ['related-two'] });
        var expected = {
            included: [
                {
                    id: '20',
                    type: 'related-twos',
                    attributes: {
                        attr2: 'value2'
                    }
                }
            ]
        };
        expect(_.matches(expected)(result)).toBe(true);
    });
    it('should still support the deprecated includeRelations option', function () {
        var model = bookshelf.Model.forge({ id: '5', atrr: 'value' });
        model.relations['related-one'] = bookshelf.Model.forge({ id: '10', attr1: 'value1' });
        model.relations['related-two'] = bookshelf.Model.forge({ id: '20', attr2: 'value2' });
        var result = mapper.map(model, 'models', { includeRelations: ['related-two'] });
        var expected = {
            included: [
                {
                    id: '20',
                    type: 'related-twos',
                    attributes: {
                        attr2: 'value2'
                    }
                }
            ]
        };
        expect(_.matches(expected)(result)).toBe(true);
    });
    it('should give an API to merge relations attributes', function () {
        pending('Not targeted for release 1.x');
    });
});
//# sourceMappingURL=bookshelf-spec.js.map
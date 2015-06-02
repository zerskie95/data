import { singularize } from "ember-inflector";
import REST2Serializer from "ember-data/serializers/rest2-serializer";
import normalizeModelName from "ember-data/system/normalize-model-name";

var forEach = Ember.EnumerableUtils.forEach;
var camelize =   Ember.String.camelize;
var classify = Ember.String.classify;
var decamelize = Ember.String.decamelize;
var underscore = Ember.String.underscore;


var ActiveModel2Serializer = REST2Serializer.extend({

  normalize: function(typeClass, hash, prop) {
    this.normalizeLinks(hash);
    return this._super(typeClass, hash, prop);
  },

  keyForAttribute: function(attr) {
    return decamelize(attr);
  },

  keyForRelationship: function(relationshipTypeKey, kind) {
    var key = decamelize(relationshipTypeKey);
    if (kind === "belongsTo") {
      return key + "_id";
    } else if (kind === "hasMany") {
      return singularize(key) + "_ids";
    } else {
      return key;
    }
  },

  serializeHasMany: Ember.K,

  payloadKeyFromModelName: function(modelName) {
    return underscore(decamelize(modelName));
  },

  serializePolymorphicType: function(snapshot, json, relationship) {
    var key = relationship.key;
    var belongsTo = snapshot.belongsTo(key);
    var jsonKey = underscore(key + "_type");

    if (Ember.isNone(belongsTo)) {
      json[jsonKey] = null;
    } else {
      json[jsonKey] = classify(belongsTo.modelName).replace(/(\/)([a-z])/g, function(match, separator, chr) {
        return match.toUpperCase();
      }).replace('/', '::');
    }
  },

  normalizeLinks: function(data) {
    if (data.links) {
      var links = data.links;

      for (var link in links) {
        var camelizedLink = camelize(link);

        if (camelizedLink !== link) {
          links[camelizedLink] = links[link];
          delete links[link];
        }
      }
    }
  },

  normalizeRelationships: function(typeClass, hash) {

    if (this.keyForRelationship) {
      typeClass.eachRelationship(function(key, relationship) {
        var payloadKey, payload;
        if (relationship.options.polymorphic) {
          payloadKey = this.keyForAttribute(key, "deserialize");
          payload = hash[payloadKey];
          if (payload && payload.type) {
            payload.type = this.modelNameFromPayloadKey(payload.type);
          } else if (payload && relationship.kind === "hasMany") {
            var self = this;
            forEach(payload, function(single) {
              single.type = self.modelNameFromPayloadKey(single.type);
            });
          }
        } else {
          payloadKey = this.keyForRelationship(key, relationship.kind, "deserialize");
          if (!hash.hasOwnProperty(payloadKey)) { return; }
          payload = hash[payloadKey];
        }

        hash[key] = payload;

        if (key !== payloadKey) {
          delete hash[payloadKey];
        }
      }, this);
    }
  },

  modelNameFromPayloadKey: function(key) {
    var convertedFromRubyModule = camelize(singularize(key)).replace(/(^|\:)([A-Z])/g, function(match, separator, chr) {
      return match.toLowerCase();
    }).replace('::', '/');
    return normalizeModelName(convertedFromRubyModule);
  }
});

export default ActiveModel2Serializer;

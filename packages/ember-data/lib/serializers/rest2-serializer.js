import RESTSerializer from "ember-data/serializers/rest-serializer";
import {
  _normalizeSerializerPayloadItem,
  pushPayload
} from "ember-data/system/store/serializer-response";
import coerceId from "ember-data/system/coerce-id";

var forEach = Ember.ArrayPolyfills.forEach;

var REST2Serializer = RESTSerializer.extend({

  normalize: function(typeClass, hash, prop) {
    return {
      data: _normalizeSerializerPayloadItem(typeClass, this._super(typeClass, hash, prop)),
      included: []
    };
  },

  normalizeResponse: function(store, primaryTypeClass, payload, id, requestType) {
    var document = {
      data: null,
      included: []
    };

    var isSingle = !Ember.A(['findAll', 'findHasMany', 'findMany', 'findQuery']).contains(requestType);

    for (var prop in payload) {
      var modelName = prop;
      var forcedSecondary = false;

      if (prop.charAt(0) === '_') {
        forcedSecondary = true;
        modelName = prop.substr(1);
      }

      var typeName = this.modelNameFromPayloadKey(modelName);
      if (!store.modelFactoryFor(typeName)) {
        Ember.warn(this.warnMessageNoModelForKey(modelName, typeName), false);
        continue;
      }

      var isPrimary = (!forcedSecondary && this.isPrimaryType(store, typeName, primaryTypeClass));
      var value = payload[prop];

      if (value === null) {
        continue;
      }

      // legacy support for singular resources
      if (isPrimary && Ember.typeOf(value) !== 'array') {
        let { data, included } = this.normalize(primaryTypeClass, value, prop);
        document.data = data;
        document.included.push(...included);
        continue;
      }

      let { data, included } = this.normalizeArray(store, typeName, value, prop);

      if (isSingle) {
        /*jshint loopfunc:true*/
        forEach.call(data, function(resource) {

          var isFirstCreatedRecord = isPrimary && !id && !document.data;
          var isUpdatedRecord = isPrimary && coerceId(resource.id) === id;

          // find the primary record.
          //
          // It's either:
          // * the record with the same ID as the original request
          // * in the case of a newly created record that didn't have an ID, the first
          //   record in the Array
          if (isFirstCreatedRecord || isUpdatedRecord) {
            document.data = resource;
          } else {
            document.included.push(resource);
          }
        });
      } else {
        if (isPrimary) {
          document.data = data;
        } else {
          document.included.push(...data);
        }
      }

      document.included.push(...included);
    }

    //var meta = this.normalizeMeta(store, ....)
    return document;
  },

  pushPayload: function(store, rawPayload) {
    let document = {
      data: [],
      included: []
    };
    let payload = this.normalizePayload(rawPayload);

    for (var prop in payload) {
      var modelName = this.modelNameFromPayloadKey(prop);
      if (!store.modelFactoryFor(modelName)) {
        Ember.warn(this.warnMessageNoModelForKey(prop, modelName), false);
        continue;
      }
      var type = store.modelFor(modelName);
      var typeSerializer = store.serializerFor(type);

      /*jshint loopfunc:true*/
      forEach.call(Ember.makeArray(payload[prop]), hash => {
        let { data, included } = typeSerializer.normalize(type, hash, prop);
        document.data.push(data);
        document.included.push(...included);
      }, this);
    }

    pushPayload(store, document);
  },

  normalizeArray: function(store, typeName, arrayHash, prop) {
    let data = [];
    let included = [];
    let array = this._super(store, typeName, arrayHash, prop);

    array.forEach(item => {
      data.push(item.data);
      included.push(...item.included);
    });

    return { data, included };
  }
});

export default REST2Serializer;

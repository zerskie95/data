import JSONSerializer from "ember-data/serializers/json-serializer";
import { _normalizeSerializerPayloadItem } from "ember-data/system/store/serializer-response";

//var get = Ember.get;
//var isNone = Ember.isNone;
//var map = Ember.ArrayPolyfills.map;
//var merge = Ember.merge;

export default JSONSerializer.extend({

  normalize(typeClass, hash, prop) {
    return {
      data: _normalizeSerializerPayloadItem(typeClass, this._super(typeClass, hash, prop)),
      included: []
    };
  },

  normalizeResponse(store, primaryTypeClass, payload, id, requestType) {
    var document = {
      data: null,
      included: []
    };

    payload = this.normalizePayload(payload);

    if (Ember.isArray(payload)) {
      document.data = payload.map((item) => {
        let { data } = this.normalize(primaryTypeClass, item);
        return data;
      });
    } else {
      let { data } = this.normalize(primaryTypeClass, payload);
      document.data = data;
    }

    return document;
  }

  /*normalize: function(typeClass, hash) {
    if (!hash) { return hash; }

    this.normalizeId(hash);
    this.normalizeAttributes(typeClass, hash);
    this.normalizeRelationships(typeClass, hash);

    this.normalizeUsingDeclaredMapping(typeClass, hash);
    this.applyTransforms(typeClass, hash);
    return hash;
  },*/
});

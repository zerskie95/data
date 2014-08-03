/**
  @module ember-data
*/

var get = Ember.get;
var set = Ember.set;
var forEach = Ember.EnumerableUtils.forEach;

/**
  @class ZalgoProxy
  @namespace DS
  @private
  @extends Ember.ObjectProxy
*/
export default Ember.ObjectProxy.extend({
    get: function(keyName) {
      if (keyName === 'content'){
        return this._super(keyName);
      }
      var model = this.get('content');
      var relationshipMeta = model.constructor.metaForProperty(keyName);
      if (relationshipMeta && relationshipMeta.isRelationship && relationshipMeta.options.async) {
        if (model._relationships[keyName] && model._relationships[keyName].get('promise') === 'isFulfilled') {
          return model._relationships[keyName];
        } else {
          return model.data[keyName];
        }
      } else {
        return this._super(keyName);
      }
    },
    eachRelationship: function(callback, binding) {
      this.get('content').eachRelationship(callback, binding);
    },
    eachAttribute: function(callback, binding) {
      this.get('content').eachAttribute(callback, binding);
    }

});

//TODO Warn against using constructor.typeKey

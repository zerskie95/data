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
var ZalgoProxy = Ember.Object.extend({
    unknownProperty: function(keyName) {
      var relationship;
      var relationshipMeta;
      var model = this.get('content');
      var isRelationship = get(model.constructor, 'relationshipsByName').get(keyName);

      if (isRelationship) {
        relationshipMeta = model.constructor.metaForProperty(keyName);
      }

      if (relationshipMeta && relationshipMeta.isRelationship && relationshipMeta.options.async) {
        if (model._relationships[keyName] && model._relationships[keyName].get('promise') === 'isFulfilled') {
          relationship = model._relationships[keyName];
        } else {
          relationship =  model._data[keyName];
        }
        if (relationshipMeta.kind === 'belongsTo' && relationship){
          relationship = ZalgoProxy.create({content: relationship});
        }
        if (relationshipMeta.kind === 'hasMany' && relationship){
          relationship = Ember.A(relationship).map( function(record){
           return ZalgoProxy.create({ content: record });
          });
        }
        return relationship;
      } else {
        return model.get(keyName);
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
export default ZalgoProxy;

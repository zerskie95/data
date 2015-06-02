import EmbeddedRecordsMixin from "ember-data/serializers/embedded-records-mixin";

var get = Ember.get;
var set = Ember.set;

var EmbeddedRecords2Mixin = Ember.Mixin.create(EmbeddedRecordsMixin, {

  normalize(typeClass, hash, prop) {
    let normalizedHash = this._super(...arguments);
    return extractEmbeddedRecords(this, this.store, typeClass, normalizedHash);
  }
});

function extractEmbeddedRecords(serializer, store, typeClass, partial) {
  typeClass.eachRelationship((key, relationship) => {
    if (serializer.hasDeserializeRecordsOption(key)) {
      let embeddedTypeClass = store.modelFor(relationship.type.modelName);
      if (relationship.kind === "hasMany") {
        extractEmbeddedHasMany(store, key, embeddedTypeClass, partial, relationship);
      }
      if (relationship.kind === "belongsTo") {
        extractEmbeddedBelongsTo(store, key, embeddedTypeClass, partial, relationship);
      }
    }
  });
  return partial;
}

function extractEmbeddedHasMany(store, key, typeClass, hash, relationshipMeta) {
  let relationshipHash = get(hash, `data.relationships.${key}.data`);
  if (!relationshipHash) {
    return;
  }

  let hasMany = relationshipHash.map(item => {
    let embeddedTypeClass = typeClass;
    if (relationshipMeta.options.polymorphic) {
      let modelName = item.type;
      embeddedTypeClass = store.modelFor(modelName);
    }

    let embeddedSerializer = store.serializerFor(embeddedTypeClass.modelName);
    let { data, included } = embeddedSerializer.normalize(embeddedTypeClass, item, null);
    hash.included.push(data);
    hash.included.push(...included);

    return { id: data.id, type: embeddedTypeClass.modelName };
  });

  let relationship = { data: hasMany };
  set(hash, `data.relationships.${key}`, relationship);
}

function extractEmbeddedBelongsTo(store, key, typeClass, hash, relationshipMeta) {
  let relationshipHash = get(hash, `data.relationships.${key}.data`);
  if (!relationshipHash) {
    return;
  }

  let embeddedTypeClass = typeClass;
  if (relationshipMeta.options.polymorphic) {
    let modelName = relationshipHash.type;
    embeddedTypeClass = store.modelFor(modelName);
  }

  let embeddedSerializer = store.serializerFor(embeddedTypeClass.modelName);
  let { data, included } = embeddedSerializer.normalize(embeddedTypeClass, relationshipHash, null);
  hash.included.push(data);
  hash.included.push(...included);

  let belongsTo = { id: data.id, type: embeddedTypeClass.modelName };

  let relationship = { data: belongsTo };
  set(hash, `data.relationships.${key}`, relationship);
}

export default EmbeddedRecords2Mixin;

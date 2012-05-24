var get = Ember.get, set = Ember.set, getPath = Ember.getPath;

var store, adapter;
var Comment;

module("Association/adapter integration test", {
  setup: function() {
    adapter = DS.Adapter.create();

    store = DS.Store.create({
      isDefaultStore: true,
      adapter: adapter
    });

    Comment = DS.Model.extend();
    Comment.reopen({
      body: DS.attr('string'),
      comments: DS.hasMany(Comment),
      comment: DS.belongsTo(Comment)
    });
  },

  teardown: function() {
    store.destroy();
  }
});

test("when adding a record to an association that belongs to another record that has not yet been saved, only the parent record is saved", function() {
  expect(2);

  var transaction = store.transaction();
  var parentRecord = transaction.createRecord(Comment);
  var childRecord = transaction.createRecord(Comment);

  parentRecord.get('comments').pushObject(childRecord);

  var createCalled = 0;
  adapter.createRecord = function(store, type, record) {
    createCalled++;
    if (createCalled === 1) {
      equal(record, parentRecord, "parent record is committed first");
      store.didCreateRecord(record, { id: 1 });
    } else if (createCalled === 2) {
      equal(record, childRecord, "child record is committed after its parent is committed");
    }
  };

  Ember.run(function() {
    transaction.commit();
  });
});

test("if a record is added to the store while a child is pending, auto-committing the child record should not commit the new record", function() {
  expect(2);

  var parentRecord = Comment.createRecord();
  var childRecord = Comment.createRecord();

  parentRecord.get('comments').pushObject(childRecord);

  var createCalled = 0;
  adapter.createRecord = function(store, type, record) {
    createCalled++;
    if (createCalled === 1) {
      equal(record, parentRecord, "parent record is committed first");

      Comment.createRecord();

      store.didCreateRecord(record, { id: 1 });
    } else if (createCalled === 2) {
      equal(record, childRecord, "child record is committed after its parent is committed");
    } else {
      ok(false, "Third comment should not be saved");
    }
  };

  Ember.run(function() {
    store.commit();
  });
});

test("if a parent record and an uncommitted pending child belong to different transactions, committing the parent's transaction does not cause the child's transaction to commit", function() {
  expect(1);

  var parentTransaction = store.transaction();
  var childTransaction = store.transaction();

  var parentRecord = parentTransaction.createRecord(Comment);
  var childRecord = childTransaction.createRecord(Comment);

  parentRecord.get('comments').pushObject(childRecord);

  var createCalled = 0;
  adapter.createRecord = function(store, type, record) {
    createCalled++;
    if (createCalled === 1) {
      equal(record, parentRecord, "parent record is committed");

      store.didCreateRecord(record, { id: 1 });
    } else {
      ok(false, "Child comment should not be saved");
    }
  };

  Ember.run(function() {
    parentTransaction.commit();
  });
});

test("it is possible to add an item to an association, remove it, then add it again", function() {
  expect(4);

  var Tag = DS.Model.extend({
    name: DS.attr('string')
  });

  var Person = DS.Model.extend({
    name: DS.attr('string'),
    tags: DS.hasMany(Tag)
  });

  var count = 0;

  var store = DS.Store.create({
    adapter: DS.Adapter.create({
      createRecord: function(store, type, record) {
        count++;

        if (count === 1) {
          strictEqual(type, Person, "should first try to save the parent");
          record.set('id', 1);
          store.didCreateRecord(record);
        } else if (count === 2) {
          strictEqual(record, tag1, "should then save first tag");
          record.set('id', 1);
          store.didCreateRecord(record);
        } else {
          strictEqual(record, tag2, "should then save second tag");
          record.set('id', 2);
          store.didCreateRecord(record);
        }
      }
    })
  });

  var person = store.createRecord(Person);
  var tag1 = store.createRecord(Tag);
  var tag2 = store.createRecord(Tag);

  var tags = get(person, 'tags');

  tags.pushObject(tag1);
  tags.pushObject(tag2);
  tags.removeAt(0);
  tags.pushObject(tag1);

  store.commit();

  equal(getPath(person, 'tags.length'), 2, "association is correctly populated");
});


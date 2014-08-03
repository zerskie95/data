var get = Ember.get, set = Ember.set;
var Post, post, Comment, comment, env;

module("integration/serializer/async_serialization", {
  setup: function() {
    Post = DS.Model.extend({
      title: DS.attr('string'),
      comments: DS.hasMany('comment', {async: true})
    });
    Comment = DS.Model.extend({
      body: DS.attr('string'),
      post: DS.belongsTo('post', {async: true})
    });
    env = setupStore({
      post:     Post,
      comment:  Comment
    });
    env.store.modelFor('post');
    env.store.modelFor('comment');
  },

  teardown: function() {
    env.store.destroy();
  }
});

test("Zalgo Proxy proxies fullfiled hasMany promise correctly", function() {
  expect(2);
  post = env.store.push(Post, { title: "Rails is omakase", id: "1", comments: [1,2]});

  env.adapter.findMany = function(){
    return Ember.RSVP.resolve([
      {id: 1, body: 'First comment'},
      {id: 2, body: 'Second comment'}
    ]);
  };
  env.serializer.serialize = function(record, options){
    equal(record.get('comments.length'), 2, 'comments are the correct length');
    equal(record.get('comments')[0].get('body'), 'First comment', 'comment data passed in correctly');
  };
  stop();
  post.get('comments').then(function(){
    start();
    post.serialize();
  });
});

test("Zalgo Proxy proxies unfullfiled hasMany promise correctly", function() {
  expect(2);
  post = env.store.push(Post, { title: "Rails is omakase", id: "1", comments: [1,2]});

  env.adapter.find = function(){
    ok(false, 'No async requests triggered');
  };

  env.serializer.serialize = function(record, options){
    equal(record.get('comments.length'), 2, 'comments are the correct length');
    equal(record.get('comments')[0].get('id'), '1', 'comments can have their ids accessed');
  };
  post.serialize();
});

test("Zalgo Proxy proxies fullfiled belongsTo promise correctly", function() {
  expect(1);
  comment = env.store.push(Comment, { body: "Zalgo is the devil", id: "1", post: 2});

  env.adapter.find = function(){
    return Ember.RSVP.resolve(
      {id: 2, title: 'This is a post'}
    );
  };
  env.serializer.serialize = function(record, options){
    equal(record.get('post.title'), 'This is a post', 'post data passed in correctly');
  };
  stop();
  comment.get('post').then(function(){
    start();
    comment.serialize();
  });
});

test("Zalgo Proxy proxies unfulfilled belongsTo promise correctly", function() {
  expect(1);
  comment = env.store.push(Comment, { body: "Zalgo is the devil", id: "1", post: 2});

  env.adapter.find = function(){
    return Ember.RSVP.resolve(
      {id: 2, title: 'This is a post'}
    );
  };
  env.serializer.serialize = function(record, options){
    equal(record.get('post.id'), '2', 'post id can be accessed');
  };
  comment.serialize();
});

test("Accessing a belongsTo relationship returns a new zalgo proxy when unfulfilled ", function() {
  expect(2);
  comment = env.store.push(Comment, { body: "Zalgo is the devil", id: "1", post: 2});

  env.adapter.find = function(){
    ok(false, 'No async requests triggered');
  };

  env.serializer.serialize = function(record, options){
    equal(record.get('post.id'), '2', 'post id can be accessed');
    equal(record.get('post.comments'), undefined,  'post does not have any comments');
  };
  comment.serialize();
});

test("Accessing a hasMany relationship returns a new zalgo proxy when unfulfilled ", function() {
  expect(2);
  post = env.store.push(Post, { title: "Rails is omakase", id: "1", comments: [1,2]});

  env.adapter.find = function(){
    ok(false, 'No async requests triggered');
  };

  env.serializer.serialize = function(record, options){
    equal(record.get('comments')[0].get('post'), undefined, 'the comment does not have a post set');
  };

  comment.serialize();
});


import { _ormSchema as Schema, _Db as Db, Model, belongsTo } from "@lib";

describe("Unit | Schema", function () {
  test("it can be instantiated", () => {
    let dbMock = {};
    let schema = new Schema(dbMock);
    expect(schema).toBeTruthy();
  });

  test("it cannot be instantiated without a db", () => {
    expect(function () {
      new Schema();
    }).toThrow("A schema requires a db");
  });

  test("modelFor returns model for given type if registered", () => {
    let db = new Db();
    let schema = new Schema(db);

    expect(schema.modelFor("article")).toBeUndefined();

    let authorModel = Model.extend({});
    let articleModel = Model.extend({
      author: belongsTo(),
    });
    schema.registerModel("article", articleModel);
    schema.registerModel("author", authorModel);

    expect(schema.modelFor("article").foreignKeys).toEqual(["authorId"]);
    expect(schema.modelFor("author").foreignKeys).toEqual([]);
  });

  test("`first()` returns the first record or null when no records exist", () => {
    let db = new Db();
    let schema = new Schema(db);

    let authorModel = Model.extend({});
    schema.registerModel("author", authorModel);

    // No records exist
    expect(schema.first("author")).toBeNull();

    // Create a record and verify it is returned
    let record = schema.create("author", { id: 1, name: "Mary Roach" });
    let firstRecord = schema.first("author");

    expect(firstRecord).toEqual(record);
  });

  test("`findBy()` returns null when nothing is found", () => {
    expect.assertions(3);

    let db = new Db();
    let schema = new Schema(db);

    let authorModel = Model.extend({});
    schema.registerModel("author", authorModel);

    expect(schema.findBy("author", { name: "Mary Roach" })).toBeNull();

    let record = schema.create("author", { id: 1, name: "Mary Roach" });

    expect(schema.findBy("author", { name: "Mary Roach" })).toEqual(record);
    expect(schema.findBy("author", { name: "Charles Dickens" })).toBeNull();
  });

  test("`findBy()` accepts a predicate function to find the desired instance", () => {
    const db = new Db();
    const schema = new Schema(db);

    const movieModel = Model.extend({});
    schema.registerModel("movie", movieModel);

    schema.create("movie", { id: 1, title: "Up" });
    const movie = schema.create("movie", { id: 2, title: "Some title" });
    schema.create("movie", { id: 3, title: "Some other title" });
    const found = schema.findBy("movie", (movie) => movie.title.length > 4);

    // Finds the first match
    expect(found).toEqual(movie);
  });
});

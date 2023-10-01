// base - Product.find()
// base - Product.find(category: {"hoodies"})

const { json } = require("express");

//query - search=coder&page=2&category=shortsleeves&rating[gte]=4&price[lte]=999&price[gte]=199&limit=5
//this query is url, but req.query is an object

class WhereClause {
  constructor(base, query) {
    this.base = base;
    this.query = query;
  }

  search() {
    const searchword = this.query.search
      ? {
          name: {
            $regex: this.query.search, // mongoose provides $regex to search similar to word to be searched
            $options: "i", // option i means case insenstive
          },
        }
      : {};

    this.base = this.base.find({ ...searchword }); // Product.find().find({searchword})
    return this;
  }

  pager(resultperpage) {
    const currentPage = this.query.page ? this.query.page : 1;

    const skipValue = resultperpage * (currentPage - 1);

    this.base = this.base.limit(resultperpage).skip(skipValue); // Product.find().limit(resultperpage).skip(skipValue)
    return this;
  }

  filter() {
    // make copy object of original query object so that any modifications to object would not affect original query object
    let copyOfQuery = { ...this.query };

    // delete search, page, and limit key-value from query object
    delete copyOfQuery["search"];
    delete copyOfQuery["page"];
    delete copyOfQuery["limit"];

    // convert query object to string
    let stringOfCopyOfQuery = JSON.stringify(copyOfQuery);

    // replace gte with $gte and lte with $lte
    const regex = /\b(gte|lte)\b/g;
    stringOfCopyOfQuery.replace(regex, (match) => `$${match}`);

    // again convert string after modifying to an object
    const jsonObjectForDB = JSON.parse(stringOfCopyOfQuery);

    this.base = this.base.find(jsonObjectForDB);
    return this;
  }
}

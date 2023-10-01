// base - Product.find()
// base - Product.find(category: {"hoodies"})

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
}

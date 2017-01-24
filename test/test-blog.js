const chai = require('chai');
const chaiHttp = require('chai-http');
const faker = require('faker');
const mongoose = require('mongoose');

const should = chai.should();

const {
    Restaurant
} = require('../models');
const {
    app, runServer, closeServer
} = require('../server');
const {
    TEST_DATABASE_URL
} = require('../config');

chai.use(chaiHttp);


function seedBlog() {
    console.info('seeding blog post data');
    const seedData = [];

    for (let i = 1; i <= 10; i++) {
        seedData.push(generateBlogData());
    }
    // this will return a promise
    return BlogPost.insertMany(seedData);
}

// used to generate data to put in db
function generateTitle() {
    const title = [
        'Title1', 'Title2', 'Title3', 'Title4', 'Title5'];
    return title[Math.floor(Math.random() * title.length)];
}

// used to generate data to put in db
function generateContent() {
    const content = faker.lorem.text();
    return content = content[Math.floor(Math.random() * content.length)];
}

function createBlogPost() {
    return {
        author: {
            firstName: faker.firstName(),
            lastName: faker.lastName()
        },
        title: generateTitle(),
        content: generateContent()
    }
}

function tearDownDb() {
    console.warn('Deleting database');
    return mongoose.connection.dropDatabase();
}

describe('Blog Api', function () {
    before(function () {
        return runServer(TEST_DATABASE_URL);
    });
    beforeEach(function () {
        return tearDownDb();
    });

    after(function () {
        return closeServer();
    })

    describe('GET endpoint', function () {

        it('should return all blog posts', function () {
            let res;
            return chai.request(app)
                .get('/posts')
                .then(function (_res) {
                    res = _res;
                    res.should.have.status(200);
                    res.body.BlogPost.should.have.length.of.at.least(1);
                    return .BlogPost.count();
                })
                .then(function (count) {
                    res.body.BlogPost.should.have.length.of(count);
                });
        });
        it('should return blog posts with correct fields', function () {

            let responceBlog;
            return chai.request(app)
                .get('/posts')
                .then(function (res) {
                    res.should.have.status(200);
                    res.should.be.json;
                    res.body.posts.should.be.a('array');
                    res.body.posts.should.have.length.of.at.least(1);

                    res.body.posts.forEach(function (posts) {
                        posts.should.be.a('object');
                        posts.should.include.keys(
                            'id', 'author', 'content', 'title', 'created');
                    });
                    responceBlog = res.body.posts[0];
                    return BlogPost.findById(responceBlog.id);
                })
                .then(function (posts) {
                    responceBlog.id.should.equal(posts.id);
                    responceBlog.title.should.equal(posts.title);
                    responceBlog.author.should.equal(posts.author);
                    responceBlog.content.should.equal(posts.content);
                });
        });
    });
    describe('PUT endpoint', function () {
        it('should update fields', function () {
            const updateData = {
                title: 'Blogs Rule',
                content: 'they are so fun to write!'
                author: {
                    firstName: 'Alexander',
                    lastName: 'Dumas'
                }
            };
            return BlogPost
                .findOne()
                .exec()
                .then(function (posts) {
                    updateData.id = posts.id;
                    return BlogPost.findById(updateData.id).exec();
                })
                .then(function (posts) {
                    posts.title.should.equal(updateData.title);
                    posts.author.should.equal(updateData.author);
                    posts.content.should.equal(updateData.content);
                });
        });
    });
    describe('POST endpoint', function () {
        it('should create a new blog post', function () {
            const newPost = createBlogPost();

            return chai.request(app)
                .post('/posts')
                .send(newPost)
                .then(function (res) {
                    res.should.have.status(201);
                    res.should.be.json;
                    res.body.should.be.a('object');
                    res.body.should.include.keys(
                        'id', 'title', 'content', 'author', 'created');
                    res.body.title.should.equal(newPost.title);
                    res.body.author.should.equal(`${newPost.author.firstName}${newPost.author.lastName}`);
                    res.body.content.should.equal(newPost.content);
                    return BlogPost.findById(res.body.id).exec();
                })
                .then(function (posts) {
                    posts.title.should.equal(newPost.title);
                    posts.content.should.equal(newPost.content);
                    posts.author.firstName.should.equal(newPost.author.firstName);
                    posts.author.lastName.should.equal(newPost.author.lastName);
                });
        });
    });
    describe('DELETE endpoint', function () {
        it('should delete a post by id', function () {
            let posts;
            return BlogPost
                .findOne()
                .exec()
                .then(function (_posts) {
                    posts = _posts;
                    return chai.request(app).delete(`/posts/${posts.id}`);
                })
                .then(function (res) {
                    res.should.have.status(204);
                    return BlogPost.findById(posts.id);
                })
                .then(function (_posts) {
                    should.not.exist(_posts);
                });
        });
    });
});

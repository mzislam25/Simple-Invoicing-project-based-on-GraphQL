const express = require('express');
const session = require('express-session');
const graphqlHTTP = require('express-graphql').graphqlHTTP;
const schema = require('./schemas/schema');
const mongoose = require('mongoose');
const passport = require('passport');
const { GraphQLLocalStrategy, buildContext } = require('graphql-passport');
const User = require('./models/user');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcrypt');

passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
    const user = await User.findById(id);
    done(null, user);
});

passport.use(
    new GraphQLLocalStrategy(async (email, password, done) => {
        const user = await User.findOne({ email: email });
        if (!user) {
            new Error('No user with that email')
        }
        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid) {
            new Error('Your password was incorrect!')
        }
        const error = isValid ? null : new Error('no matching user');
        done(error, user);
    }),
);

const app = express();
app.use(session({
    genid: (req) => uuidv4(),
    secret: 'IAMSECRET',
    resave: false,
    saveUninitialized: false,
}));
app.use(passport.initialize());
app.use(passport.session());

mongoose.connect('mongodb://localhost/graphql-test')
mongoose.connection.once('open', () => {
    console.log('Conneted to Database');
});
const graphqlHTTPInit = graphqlHTTP((req, res) => {
    return ({
        schema,
        graphiql: true,
        context: buildContext({ req, res, User })
    });
})

app.use('/graphql', graphqlHTTPInit);

app.listen(3000, () => {
    console.log('Listening on port 3000');
});

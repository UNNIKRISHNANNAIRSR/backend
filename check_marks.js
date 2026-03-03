const mongoose = require('mongoose');
const Mark = require('./models/Mark');

mongoose.connect('mongodb+srv://admin:admin1234@cluster0.p0kxp1x.mongodb.net/eduai?retryWrites=true&w=majority').then(async () => {
    const marks = await Mark.find({});
    console.log(JSON.stringify(marks.slice(-10), null, 2));
    process.exit(0);
}).catch(err => {
    console.error(err);
    process.exit(1);
});

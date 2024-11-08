// models/Schedule.js
const { DataTypes } = require('sequelize');
const sequelize = require('./index');

// Mendefinisikan model Schedule
const Schedule = sequelize.define('Schedule', {
    movie_id: {
        type: DataTypes.INTEGER,
        references: {
            model: 'movies',
            key: 'id'
        }
    },
    theater_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    studio: {
        type: DataTypes.STRING,
        allowNull: false
    },
    show_time: {
        type: DataTypes.TIME,
        allowNull: false
    }
}, {
    tableName: 'schedules',
    timestamps: false
});

module.exports = Schedule;

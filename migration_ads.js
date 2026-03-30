const { sequelize, connectDB } = require('./config/db');
const { Sequelize } = require('sequelize');

(async () => {
    try {
        await connectDB();
        const queryInterface = sequelize.getQueryInterface();
        const tableInfo = await queryInterface.describeTable('Ads');

        const columnsToAdd = [
            { name: 'bedrooms', type: Sequelize.INTEGER },
            { name: 'bathrooms', type: Sequelize.INTEGER },
            { name: 'propertyType', type: Sequelize.STRING },
            { name: 'subCategory', type: Sequelize.STRING },
            { name: 'area', type: Sequelize.STRING },
            { name: 'rejectionReason', type: Sequelize.TEXT },
            { name: 'views', type: Sequelize.INTEGER, defaultValue: 0 },
            { name: 'phone', type: Sequelize.STRING },
            { name: 'isFeatured', type: Sequelize.BOOLEAN, defaultValue: false },
            { name: 'featuredUntil', type: Sequelize.DATE }
        ];

        for (const col of columnsToAdd) {
            if (!tableInfo[col.name]) {
                console.log(`➕ Adding column: ${col.name}`);
                try {
                    await queryInterface.addColumn('Ads', col.name, {
                        type: col.type,
                        allowNull: true,
                        defaultValue: col.defaultValue !== undefined ? col.defaultValue : null
                    });
                } catch (e) {
                    console.log(`⚠️ ${col.name} might already exist or failed: ${e.message}`);
                }
            } else {
                console.log(`✅ Column ${col.name} already exists.`);
            }
        }

        console.log('🎉 Database migration complete!');
        process.exit(0);
    } catch (err) {
        console.error('❌ Migration failed:', err.message);
        process.exit(1);
    }
})();

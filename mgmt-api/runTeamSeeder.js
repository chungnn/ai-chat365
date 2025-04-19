// Script để chạy team seeder
const seedTeams = require('./src/seeder/teamSeeder');

// Chạy seeder
seedTeams()
  .then(() => {
    console.log('Seeding teams completed successfully!');
    process.exit(0);
  })
  .catch(error => {
    console.error('Error seeding teams:', error);
    process.exit(1);
  });

const dotenv = require('dotenv');

dotenv.config();

const chai = require('chai');
const sinonChai = require('sinon-chai');
const chaiAsPromised = require('chai-as-promised');

chai.use(sinonChai);
chai.use(chaiAsPromised);


const {expect} = chai;

const User = require('../../models/user');

const constUser = {
  email: 'provaEmail',
  password: 'Password123',
  name: 'Cristian',
  surname: 'Barletta',
  role: 'DDI',
  verified: '1',
};

describe('User model', function() {
  describe('Create method', function() {
    let user;

    beforeEach(function() {
      user = JSON.parse(JSON.stringify(constUser));
    });

    afterEach(async function() {
      await User.delete(user);
    });

    it('Create_1', async function() {
      expect(User.create(null)).to.be.rejectedWith(Error, 'User must not be null');
    });

    it('Create_2', async function() {
      expect(User.create(user)).to.be.fulfilled;
    });

    it('Create_3', async function() {
      const insertUser = await User.create(user);

      expect(User.create(insertUser)).to.be.rejectedWith(Error);
    });
  });

  describe('Update method', function() {
    let user;

    beforeEach(async function() {
      user = JSON.parse(JSON.stringify(constUser));
      await User.create(user);
    });

    afterEach(async function() {
      user = JSON.parse(JSON.stringify(constUser));
      await User.delete(user);
    });

    it('Update_1', function() {
      expect(User.update(null)).to.be.rejectedWith(Error, 'User must not be null');
    });

    it('Update_2', function() {
      user.email = 'nonEsiste';

      expect(User.update(user)).to.be.rejectedWith(Error, 'The user doesn\'t exists');
    });

    it('Update_3', function() {
      user.password = null;
      expect(User.update(user)).to.be.fulfilled;
    });

    it('Update_4', function() {
      expect(User.update(user)).to.be.fulfilled;
    });
  });

  describe('Delete method', function() {
    let user;

    beforeEach(async function() {
      user = JSON.parse(JSON.stringify(constUser));
      await User.create(user);
    });

    afterEach(async function() {
      user = JSON.parse(JSON.stringify(constUser));
      await User.delete(user);
    });

    it('Delete_1', function() {
      expect(User.delete(null)).to.be.rejectedWith(Error, 'User must not be null');
    });

    it('Delete_2', async function() {
      expect(User.delete(user)).to.be.fulfilled;
    });
  });

  describe('Exists method', function() {
    let user;

    beforeEach(async function() {
      user = JSON.parse(JSON.stringify(constUser));
      await User.create(user);
    });

    afterEach(async function() {
      user = JSON.parse(JSON.stringify(constUser));
      await User.delete(user);
    });

    it('Exists_1', function() {
      expect(User.exists(null)).to.be.rejectedWith(Error, 'User must not be null');
    });

    it('Exists_2', function() {
      expect(User.exists(user)).to.be.fulfilled;
    });
  });

  describe('FindByEmail method', function() {
    let user;

    beforeEach(async function() {
      user = JSON.parse(JSON.stringify(constUser));
      await User.create(user);
    });

    afterEach(async function() {
      user = JSON.parse(JSON.stringify(constUser));
      await User.delete(user);
    });

    it('findByEmail_1', function() {
      expect(User.findByEmail(null)).to.be.rejectedWith(Error, 'Email must not be null');
    });

    it('findByEmail_2', async function() {
      expect(await User.findByEmail('nonesiste')).to.be.equal(null);
    });

    it('findByEmail_3', async function() {
      expect((await User.findByEmail(user.email)).email).to.be.equal(user.email);
    });

    it('findByEmail_4', function() {
      expect(User.findByEmail({hey: 'hey'})).to.be.rejectedWith(Error);
    });
  });

  describe('findByRole method', function() {
    let user;

    beforeEach(async function() {
      user = JSON.parse(JSON.stringify(constUser));
      await User.create(user);
    });

    afterEach(async function() {
      user = JSON.parse(JSON.stringify(constUser));
      await User.delete(user);
    });

    it('findByRole_1', function() {
      expect(User.findByRole(null)).to.be.rejectedWith(Error, 'Role must not be null');
    });

    it('findByRole_2', function() {
      expect(User.findByRole('Student')).to.be.fulfilled;
    });

    it('findByRole_3', function() {
      expect(User.findByRole({role: 'hey', hey: 'hey'})).to.be.rejectedWith(Error);
    });
  });

  describe('findByVerified method', function() {
    let user;

    beforeEach(async function() {
      user = JSON.parse(JSON.stringify(constUser));
      await User.create(user);
    });

    afterEach(async function() {
      user = JSON.parse(JSON.stringify(constUser));
      await User.delete(user);
    });

    it('findByVerified_1', function() {
      expect(User.findByVerified(null)).to.be.rejectedWith(Error, 'Verified status must not be null');
    });

    it('findByVerified_2', async function() {
      expect(User.findByVerified(1)).to.be.fulfilled; // Added to remove a warning about promise handling
    });

    it('findByVerified_3', function() {
      expect(User.findByVerified({role: 'hey', hey: 'hey'})).to.be.rejectedWith(Error);
    });
  });

  describe('findAll method', function() {
    it('findAll', function() {
      expect(User.findAll()).to.be.fulfilled;
    });
  });

  describe('Search method', function() {
    let filter;

    beforeEach(function() {
      filter = JSON.parse(JSON.stringify(constUser));
    });

    it('search_1', function() {
      expect(User.search(null)).to.be.rejectedWith(Error);
    });

    it('seatch_2', function() {
      expect(User.search(filter)).to.be.fulfilled;
    });

    it('seatch_3', function() {
      filter = {};
      expect(User.search(filter)).to.be.fulfilled;
    });
  });

  describe('MatchUser method', function() {
    let user;

    beforeEach(async function() {
      user = JSON.parse(JSON.stringify(constUser));
      await User.create(user);
    });

    afterEach(async function() {
      user = JSON.parse(JSON.stringify(constUser));
      await User.delete(user);
    });

    it('matchUser_1', function() {
      expect(User.matchUser(user.email, null)).to.be.rejectedWith(Error, 'Email or Password can not be null or undefined');
    });

    it('matchUser_2', async function() {
      expect(await User.matchUser(user.email, 'password')).to.be.equal(null);
    });

    it('matchUser_3', function() {
      expect(User.matchUser({hey: 'hey'}, user.password)).to.be.rejectedWith(Error);
    });

    it('matchUser_4', function() {
      expect(User.matchUser(user.email, 'Password123')).to.be.fulfilled;
    });
  });
});

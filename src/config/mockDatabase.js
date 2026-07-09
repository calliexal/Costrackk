// Mock Database untuk Development/Testing
// Menyimpan data di memory dengan opsi backup ke file

const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, '../../data.json');

class MockDatabase {
  constructor() {
    this.data = {
      produkts: [],
      komponen: [],
      kurs: [],
      riwayat: [],
      hpe: []
    };
    this.loadData();
  }

  loadData() {
    try {
      if (fs.existsSync(DATA_FILE)) {
        const fileData = fs.readFileSync(DATA_FILE, 'utf-8');
        this.data = JSON.parse(fileData);
        console.log('✓ Mock Database: Data loaded from file');
      }
    } catch (err) {
      console.log('✓ Mock Database: Starting with empty data');
    }
  }

  saveData() {
    try {
      fs.writeFileSync(DATA_FILE, JSON.stringify(this.data, null, 2));
    } catch (err) {
      console.error('Error saving mock data:', err.message);
    }
  }

  // Product methods
  async createProduct(data) {
    const product = { id: Date.now().toString(), ...data, createdAt: new Date() };
    this.data.produkts.push(product);
    this.saveData();
    return product;
  }

  async getProducts() {
    return this.data.produkts;
  }

  async getProductById(id) {
    return this.data.produkts.find(p => p.id === id);
  }

  async updateProduct(id, data) {
    const index = this.data.produkts.findIndex(p => p.id === id);
    if (index !== -1) {
      this.data.produkts[index] = { ...this.data.produkts[index], ...data };
      this.saveData();
      return this.data.produkts[index];
    }
    return null;
  }

  async deleteProduct(id) {
    const index = this.data.produkts.findIndex(p => p.id === id);
    if (index !== -1) {
      this.data.produkts.splice(index, 1);
      this.saveData();
      return true;
    }
    return false;
  }

  // Komponen methods
  async createKomponen(data) {
    const komponen = { id: Date.now().toString(), ...data, createdAt: new Date() };
    this.data.komponen.push(komponen);
    this.saveData();
    return komponen;
  }

  async getKomponen() {
    return this.data.komponen;
  }

  async getKomponenById(id) {
    return this.data.komponen.find(k => k.id === id);
  }

  // Kurs methods
  async createKurs(data) {
    const kurs = { id: Date.now().toString(), ...data, createdAt: new Date() };
    this.data.kurs.push(kurs);
    this.saveData();
    return kurs;
  }

  async getKurs() {
    return this.data.kurs;
  }

  // Riwayat methods
  async addRiwayat(data) {
    const riwayat = { id: Date.now().toString(), ...data, createdAt: new Date() };
    this.data.riwayat.push(riwayat);
    this.saveData();
    return riwayat;
  }

  async getRiwayat() {
    return this.data.riwayat;
  }
}

module.exports = new MockDatabase();

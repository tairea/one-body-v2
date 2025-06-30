<script>
import { useAppStore } from '../stores/app'

export default {
  name: 'AddPersonDialog',
  emits: ['close', 'save'],
  data() {
    return {
      name: '',
      email: ''
    }
  },
  computed: {
    appStore() {
      return useAppStore()
    }
  },
  methods: {
    handleSave() {
      if (this.name.trim() && this.email.trim()) {
        this.$emit('save', {
          name: this.name.trim(),
          email: this.email.trim()
        })
        // Reset form
        this.name = ''
        this.email = ''
      }
    },
    handleCancel() {
      this.$emit('close')
      // Reset form
      this.name = ''
      this.email = ''
    },
    handleClose() {
      this.$emit('close')
      // Reset form
      this.name = ''
      this.email = ''
    }
  }
}
</script>

<template>
  <div class="dialog-overlay" @click="handleClose">
    <div class="dialog" :class="{ 'dark-mode': appStore.isDarkMode }" @click.stop>
      <!-- Close button -->
      <button class="close-button" @click="handleClose">
        <span>&times;</span>
      </button>

      <!-- Dialog header -->
      <div class="dialog-header">
        <h2>Add New Person</h2>
      </div>

      <!-- Dialog content -->
      <div class="dialog-content">
        <div class="form-group">
          <label for="name">Name:</label>
          <input 
            id="name"
            v-model="name"
            type="text" 
            placeholder="Enter full name"
            class="form-input"
          />
        </div>

        <div class="form-group">
          <label for="email">Email:</label>
          <input 
            id="email"
            v-model="email"
            type="email" 
            placeholder="Enter email address"
            class="form-input"
          />
        </div>
      </div>

      <!-- Dialog actions -->
      <div class="dialog-actions">
        <button class="btn btn-secondary" @click="handleCancel">
          Cancel
        </button>
        <button 
          class="btn btn-primary" 
          @click="handleSave"
          :disabled="!name.trim() || !email.trim()"
        >
          Save
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
}

.dialog {
  background: white;
  border-radius: 12px;
  padding: 24px;
  width: 90%;
  max-width: 400px;
  position: relative;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
}

.close-button {
  position: absolute;
  top: 12px;
  right: 16px;
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #666;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: background-color 0.2s;
}

.close-button:hover {
  background-color: #f0f0f0;
}

.dialog-header {
  margin-bottom: 20px;
  padding-right: 40px;
}

.dialog-header h2 {
  margin: 0;
  font-size: 1.5rem;
  color: #333;
}

.dialog-content {
  margin-bottom: 24px;
}

.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  margin-bottom: 6px;
  font-weight: 500;
  color: #333;
}

.form-input {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
  box-sizing: border-box;
  transition: border-color 0.2s;
}

.form-input:focus {
  outline: none;
  border-color: #007bff;
  box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
}

.dialog-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}

.btn {
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary {
  background-color: #007bff;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background-color: #0056b3;
}

.btn-primary:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}

.btn-secondary {
  background-color: #6c757d;
  color: white;
}

.btn-secondary:hover {
  background-color: #545b62;
}

/* Dark mode styles */
.dialog.dark-mode {
  background-color: #2d3748;
  color: rgba(255, 255, 255, 0.87);
}

.dialog.dark-mode .dialog-header h2 {
  color: rgba(255, 255, 255, 0.87);
}

.dialog.dark-mode .form-group label {
  color: rgba(255, 255, 255, 0.87);
}

.dialog.dark-mode .form-input {
  background-color: #4a5568;
  border-color: #718096;
  color: rgba(255, 255, 255, 0.87);
}

.dialog.dark-mode .form-input:focus {
  border-color: #4299e1;
  box-shadow: 0 0 0 2px rgba(66, 153, 225, 0.25);
}

.dialog.dark-mode .close-button {
  color: rgba(255, 255, 255, 0.6);
}

.dialog.dark-mode .close-button:hover {
  background-color: #4a5568;
}
</style> 
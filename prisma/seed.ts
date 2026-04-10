import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
})

const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('🌱 Starting seed...')

  // Create default user
  const user = await prisma.user.upsert({
    where: { id: 'default-user' },
    update: {},
    create: {
      id: 'default-user',
      name: 'Admin User',
      username: 'admin',
      password: '$2b$10$W204f.Gk/CRAXiBTdV0hbuQC/zV.ApFXyBIHxTrvSe6DUBCHv8bbq', // admin123
      department: 'Operations',
      role: 'admin',
      ocrMode: 'gemini'
    }
  })
  console.log('✓ Created user:', user.name)

  // Template 1: Báo cáo phụ thu dầu DO
  const template1 = await prisma.template.upsert({
    where: { id: 'template-fuel-surcharge' },
    update: {},
    create: {
      id: 'template-fuel-surcharge',
      name: 'Báo cáo phụ thu dầu DO',
      description: 'Báo cáo phụ thu nhiên liệu dầu DO cho container',
      gasTemplateId: 'YOUR_GOOGLE_DOCS_TEMPLATE_ID_1', // Replace with actual template ID
      status: 'active',
      schema: {
        fields: [
          { fieldName: 'reportDate', fieldLabel: 'Ngày báo cáo', fieldType: 'date', required: true },
          { fieldName: 'containerNumber', fieldLabel: 'Số container', fieldType: 'text', required: true },
          { fieldName: 'fuelAmount', fieldLabel: 'Số lượng dầu (lít)', fieldType: 'number', required: true },
          { fieldName: 'unitPrice', fieldLabel: 'Đơn giá (VND/lít)', fieldType: 'number', required: true },
          { fieldName: 'totalAmount', fieldLabel: 'Tổng tiền', fieldType: 'number', required: true },
          { fieldName: 'notes', fieldLabel: 'Ghi chú', fieldType: 'text', required: false }
        ]
      },
      fields: {
        create: [
          {
            fieldName: 'reportDate',
            fieldLabel: 'Ngày báo cáo',
            fieldType: 'date',
            required: true,
            order: 0
          },
          {
            fieldName: 'containerNumber',
            fieldLabel: 'Số container',
            fieldType: 'text',
            required: true,
            order: 1
          },
          {
            fieldName: 'fuelAmount',
            fieldLabel: 'Số lượng dầu (lít)',
            fieldType: 'number',
            required: true,
            order: 2
          },
          {
            fieldName: 'unitPrice',
            fieldLabel: 'Đơn giá (VND/lít)',
            fieldType: 'number',
            required: true,
            order: 3
          },
          {
            fieldName: 'totalAmount',
            fieldLabel: 'Tổng tiền',
            fieldType: 'number',
            required: true,
            order: 4
          },
          {
            fieldName: 'notes',
            fieldLabel: 'Ghi chú',
            fieldType: 'text',
            required: false,
            order: 5
          }
        ]
      }
    }
  })
  console.log('✓ Created template:', template1.name)

  // Template 2: Đăng ký dịch vụ container
  const template2 = await prisma.template.upsert({
    where: { id: 'template-container-service' },
    update: {},
    create: {
      id: 'template-container-service',
      name: 'Đăng ký dịch vụ container',
      description: 'Form đăng ký dịch vụ xử lý container tại cảng',
      gasTemplateId: 'YOUR_GOOGLE_DOCS_TEMPLATE_ID_2', // Replace with actual template ID
      status: 'active',
      schema: {
        fields: [
          { fieldName: 'companyName', fieldLabel: 'Tên công ty', fieldType: 'text', required: true },
          { fieldName: 'contactPerson', fieldLabel: 'Người liên hệ', fieldType: 'text', required: true },
          { fieldName: 'phoneNumber', fieldLabel: 'Số điện thoại', fieldType: 'text', required: true },
          { fieldName: 'email', fieldLabel: 'Email', fieldType: 'text', required: true },
          { fieldName: 'containerType', fieldLabel: 'Loại container', fieldType: 'select', required: true },
          { fieldName: 'serviceType', fieldLabel: 'Loại dịch vụ', fieldType: 'select', required: true },
          { fieldName: 'requestDate', fieldLabel: 'Ngày yêu cầu', fieldType: 'date', required: true },
          { fieldName: 'notes', fieldLabel: 'Ghi chú', fieldType: 'text', required: false }
        ]
      },
      fields: {
        create: [
          {
            fieldName: 'companyName',
            fieldLabel: 'Tên công ty',
            fieldType: 'text',
            required: true,
            order: 0
          },
          {
            fieldName: 'contactPerson',
            fieldLabel: 'Người liên hệ',
            fieldType: 'text',
            required: true,
            order: 1
          },
          {
            fieldName: 'phoneNumber',
            fieldLabel: 'Số điện thoại',
            fieldType: 'text',
            required: true,
            order: 2
          },
          {
            fieldName: 'email',
            fieldLabel: 'Email',
            fieldType: 'text',
            required: true,
            order: 3
          },
          {
            fieldName: 'containerType',
            fieldLabel: 'Loại container',
            fieldType: 'select',
            required: true,
            order: 4,
            options: ['20ft', '40ft', '40ft HC', '45ft']
          },
          {
            fieldName: 'serviceType',
            fieldLabel: 'Loại dịch vụ',
            fieldType: 'select',
            required: true,
            order: 5,
            options: ['Bốc dỡ', 'Lưu kho', 'Vận chuyển', 'Sửa chữa']
          },
          {
            fieldName: 'requestDate',
            fieldLabel: 'Ngày yêu cầu',
            fieldType: 'date',
            required: true,
            order: 6
          },
          {
            fieldName: 'notes',
            fieldLabel: 'Ghi chú',
            fieldType: 'text',
            required: false,
            order: 7
          }
        ]
      }
    }
  })
  console.log('✓ Created template:', template2.name)

  console.log('✅ Seed completed successfully!')
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
    await pool.end()
  })

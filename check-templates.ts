import { prisma } from './src/lib/prisma'

async function main() {
  const templates = await prisma.template.findMany({
    include: {
      fields: true
    }
  })
  
  console.log(`Found ${templates.length} templates.`)
  for (const t of templates) {
    console.log(`- Template: ${t.name} (ID: ${t.id}) - Fields count: ${t.fields.length}`)
    if (t.fields.length > 0) {
      console.log(`  Fields: `, t.fields.map(f => f.fieldName).join(', '))
    }
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())

import { useMemo } from 'react'; // Adicione o useMemo
import { useQuery } from '@tanstack/react-query'
import { fetchProductCategories } from '../queries/gear'
import { Container, Title, Select } from '@mantine/core'

export default function Gear() {
  const { data: categories = [], isLoading: loadingCategories } = useQuery({
    queryKey: ['categories'],
    queryFn: fetchProductCategories,
    staleTime: 1000 * 60 * 10,
  })

  // Agrupamento lógico para o Select do Mantine
  const groupedData = useMemo(() => {
    if (!categories.length) return [];

    // 1. Identificar as macro_categories únicas
    const macros = [...new Set(categories.map(c => c.macro_category))];

    // 2. Criar a estrutura: { group: 'Nome', items: [{ value, label }] }
    return macros.map(macro => ({
      group: macro || 'Outros', // Fallback caso macro_category seja null
      items: categories
        .filter(c => c.macro_category === macro)
        .map(c => ({
          value: c.id.toString(),
          label: c.name_ptbr
        }))
    }));
  }, [categories]);

  return (
    <Container size="xl" py="sm">
      <Title order={1} fz="h2" ta="left" fw={700} lts="-0.02em" mb={24}>
        Equipamentos
      </Title>

      <Select
        label="Filtrar por categoria"
        placeholder="Escolha uma categoria"
        data={groupedData}
        searchable
        nothingFoundMessage="Nada encontrado..."
        clearable
        disabled={loadingCategories}
        maxDropdownHeight={400}
      />
    </Container>
  )
}
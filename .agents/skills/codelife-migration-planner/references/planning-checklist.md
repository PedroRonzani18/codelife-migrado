# Checklist e contrato do migration-plan

## Estrutura mínima

```markdown
# Migration Plan — <módulo>

## 1. Identificação
- Jira, épico/parent e cards relacionados
- branch quando aplicável
- repositórios e fontes analisados
## 2. Objetivo da intervenção
## 3. Escopo
## 4. Fora do escopo
## 5. Estado legado
## 6. Estado atual do migrado
## 7. Linha de base
## 8. Delta legado → migrado
### Preservar
### Adaptar
### Substituir
### Remover
### Criar
## 9. Dependências
## 10. Riscos e impactos
## 11. Estratégia de modernização
## 12. Source of truth / coexistência / cutover / rollback
## 13. Arquitetura-alvo
### Backend
### Frontend
### Persistência / Prisma
### Integrações
### Segurança
### Testes
## 14. Decisões arquiteturais
## 15. Critérios de aceite
## 16. Plano de validação
## 17. Evidências esperadas para Etapa 6
## 18. Rastreabilidade Jira
## 19. Questões efetivamente bloqueantes
```

Remova seções que não se aplicam em vez de preencher com texto cerimonial,
mas registre explicitamente por que uma decisão operacional não é necessária.

## Gate G1

- [ ] Card Jira e relações acessíveis foram analisados, ou a limitação e o
  contexto equivalente foram registrados.
- [ ] Legado, migrado e linha de base foram analisados com fontes.
- [ ] Escopo, fora do escopo e preservação funcional estão claros.
- [ ] Delta e comportamentos adaptados/substituídos/removidos/criados estão
  justificados.
- [ ] Dependências, impactos, riscos e estratégia foram avaliados.
- [ ] Fonte de verdade, coexistência, cutover e rollback foram avaliados quando
  materialmente aplicáveis.
- [ ] Arquitetura-alvo respeita padrões atuais e decisões anteriores.
- [ ] Decisões relevantes têm IDs e nenhuma decisão estrutural ficou implícita.
- [ ] Critérios de aceite, validação e evidências comparáveis foram definidos.
- [ ] Rastreabilidade com Jira e limitações estão registradas.
- [ ] O plano permite criar o Roadmap sem nova decisão de escopo/arquitetura.

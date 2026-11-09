export type Technology = 'HFC' | 'GPON' | 'HÍBRIDO' | 'OUTROS';

export interface VisitData {
  id: string;
  contrato?: string;
  mes: string;
  fullDate: Date;
  cidade: string;
  area: string;
  expurgo: boolean;
  tecnologia: Technology;
  status: 'Executada' | 'Cancelada';
  notaAT1: number;
  node: string;
  cdBaixa: string;
  descriptionBaixa?: string;
  grupoBaixa: string;
  terminal: string;
  volume: number;
  tipoOs?: string;
  tipoEquipamento?: string;
  modelo?: string;
  periodoAgenda?: string;
  loginTecnico?: string; // WO_LOGIN_TEC
  login?: string; // Alias WO_LOGIN_TEC
}

export interface BaseCidadeData {
  cidade: string;
  tecnologia: Technology;
  base: number;
}

export const MOCK_DATA: VisitData[] = [
  { id: '1', contrato: '003/0129841', mes: 'Janeiro', fullDate: new Date(2024, 0, 15), cidade: 'São Paulo', area: 'Norte', expurgo: false, tecnologia: 'HFC', status: 'Executada', notaAT1: 8.5, node: 'SP01', cdBaixa: 'B01', descriptionBaixa: 'REPARO CABO / CONECTOR', grupoBaixa: 'TÉCNICO', terminal: 'TERM-01', volume: 1, tipoOs: 'REPARO', tipoEquipamento: 'MODEM / EMTA', modelo: 'HUMAX HGB10R', periodoAgenda: 'MANHÃ (08:00 - 12:00)', loginTecnico: 'TEC_SILVA', login: 'TEC_SILVA' },
  { id: '2', contrato: '003/0145892', mes: 'Janeiro', fullDate: new Date(2024, 0, 16), cidade: 'Rio de Janeiro', area: 'Sul', expurgo: false, tecnologia: 'GPON', status: 'Executada', notaAT1: 9.2, node: 'RJ05', cdBaixa: 'B02', descriptionBaixa: 'INSTALAÇÃO FTTH CONCLUÍDA', grupoBaixa: 'CLIENTE', terminal: 'TERM-02', volume: 1, tipoOs: 'INSTALAÇÃO', tipoEquipamento: 'ONU GPON', modelo: 'HUAWEI HG8245H', periodoAgenda: 'TARDE (12:00 - 18:00)', loginTecnico: 'TEC_SOUZA', login: 'TEC_SOUZA' },
  { id: '3', contrato: '003/0198234', mes: 'Fevereiro', fullDate: new Date(2024, 1, 10), cidade: 'São Paulo', area: 'Leste', expurgo: true, tecnologia: 'HÍBRIDO', status: 'Cancelada', notaAT1: 0, node: 'SP03', cdBaixa: 'B03', descriptionBaixa: 'CLIENTE AUSENTE', grupoBaixa: 'INFRA', terminal: 'TERM-03', volume: 1, tipoOs: 'REPARO', tipoEquipamento: 'DECODER (STB)', modelo: 'SAGEMCOM DSI74', periodoAgenda: 'COMERCIAL (08:00 - 18:00)', loginTecnico: 'TEC_LIMA', login: 'TEC_LIMA' },
  { id: '4', contrato: '003/0201478', mes: 'Fevereiro', fullDate: new Date(2024, 1, 11), cidade: 'Belo Horizonte', area: 'Oeste', expurgo: false, tecnologia: 'GPON', status: 'Executada', notaAT1: 7.8, node: 'BH12', cdBaixa: 'B01', descriptionBaixa: 'MUDANÇA DE PONTO', grupoBaixa: 'TÉCNICO', terminal: 'TERM-04', volume: 1, tipoOs: 'MUDANÇA DE ENDEREÇO', tipoEquipamento: 'ROUTER MESH', modelo: 'TP-LINK DECO M4', periodoAgenda: 'MANHÃ (08:00 - 12:00)', loginTecnico: 'TEC_ALVES', login: 'TEC_ALVES' },
  { id: '5', contrato: '003/0215981', mes: 'Março', fullDate: new Date(2024, 2, 5), cidade: 'São Paulo', area: 'Sul', expurgo: false, tecnologia: 'HFC', status: 'Executada', notaAT1: 8.9, node: 'SP01', cdBaixa: 'B05', descriptionBaixa: 'SUBSTITUIÇÃO DE MODEM', grupoBaixa: 'TÉCNICO', terminal: 'TERM-01', volume: 1, tipoOs: 'REPARO', tipoEquipamento: 'MODEM / EMTA', modelo: 'SAGEMCOM FAST 3890', periodoAgenda: 'TARDE (12:00 - 18:00)', loginTecnico: 'TEC_COSTA', login: 'TEC_COSTA' },
  { id: '6', contrato: '003/0228490', mes: 'Março', fullDate: new Date(2024, 2, 6), cidade: 'Rio de Janeiro', area: 'Norte', expurgo: false, tecnologia: 'GPON', status: 'Executada', notaAT1: 9.5, node: 'RJ02', cdBaixa: 'B01', descriptionBaixa: 'INSTALAÇÃO GPON FIBRA', grupoBaixa: 'TÉCNICO', terminal: 'TERM-05', volume: 1, tipoOs: 'INSTALAÇÃO', tipoEquipamento: 'ONU GPON', modelo: 'ZTE F670', periodoAgenda: 'NOITE (18:00 - 21:00)', loginTecnico: 'TEC_SANTOS', login: 'TEC_SANTOS' },
  { id: '7', contrato: '003/0239102', mes: 'Janeiro', fullDate: new Date(2024, 0, 20), cidade: 'Belo Horizonte', area: 'Leste', expurgo: false, tecnologia: 'HÍBRIDO', status: 'Executada', notaAT1: 8.2, node: 'BH08', cdBaixa: 'B02', descriptionBaixa: 'TRANSFERÊNCIA DE TITULARIDADE', grupoBaixa: 'CLIENTE', terminal: 'TERM-06', volume: 1, tipoOs: 'TRANSFERÊNCIA', tipoEquipamento: 'DECODER (STB)', modelo: 'PACE DCR7121', periodoAgenda: 'MANHÃ (08:00 - 12:00)', loginTecnico: 'TEC_OLIVEIRA', login: 'TEC_OLIVEIRA' },
  { id: '8', contrato: '003/0248173', mes: 'Fevereiro', fullDate: new Date(2024, 1, 25), cidade: 'São Paulo', area: 'Sul', expurgo: false, tecnologia: 'HFC', status: 'Executada', notaAT1: 9.0, node: 'SP01', cdBaixa: 'B01', descriptionBaixa: 'NIVELAMENTO DE SINAL RF', grupoBaixa: 'TÉCNICO', terminal: 'TERM-01', volume: 1, tipoOs: 'REPARO', tipoEquipamento: 'MODEM / EMTA', modelo: 'ARRIS TG1692', periodoAgenda: 'TARDE (12:00 - 18:00)', loginTecnico: 'TEC_PEREIRA', login: 'TEC_PEREIRA' },
  { id: '9', contrato: '003/0259810', mes: 'Março', fullDate: new Date(2024, 2, 15), cidade: 'Rio de Janeiro', area: 'Oeste', expurgo: true, tecnologia: 'GPON', status: 'Cancelada', notaAT1: 0, node: 'RJ05', cdBaixa: 'B04', descriptionBaixa: 'CANCELAMENTO A PEDIDO DO CLIENTE', grupoBaixa: 'INFRA', terminal: 'TERM-02', volume: 1, tipoOs: 'DESCONEXÃO', tipoEquipamento: 'ONU GPON', modelo: 'HUAWEI HG8245H', periodoAgenda: 'MANHÃ (08:00 - 12:00)', loginTecnico: 'TEC_ROCHA', login: 'TEC_ROCHA' },
  { id: '10', contrato: '003/0268491', mes: 'Janeiro', fullDate: new Date(2024, 0, 5), cidade: 'São Paulo', area: 'Norte', expurgo: false, tecnologia: 'GPON', status: 'Executada', notaAT1: 8.7, node: 'SP02', cdBaixa: 'B01', descriptionBaixa: 'ATIVAÇÃO ONU GPON', grupoBaixa: 'TÉCNICO', terminal: 'TERM-07', volume: 1, tipoOs: 'INSTALAÇÃO', tipoEquipamento: 'ONU GPON', modelo: 'ZTE F670', periodoAgenda: 'TARDE (12:00 - 18:00)', loginTecnico: 'TEC_MARTINS', login: 'TEC_MARTINS' },
  // Add more data to make it look real
  ...Array.from({ length: 40 }).map((_, i) => {
    const monthIdx = Math.floor(Math.random() * 3);
    const day = Math.floor(Math.random() * 28) + 1;
    const tipos = ['REPARO', 'INSTALAÇÃO', 'MUDANÇA DE ENDEREÇO', 'TRANSFERÊNCIA', 'DESCONEXÃO'];
    const descricoes = [
      'REPARO FIBRA ÓPTICA',
      'TROCA DE DROP ÓPTICO',
      'SUBSTITUIÇÃO DE FONTE',
      'REPARO CONECTOR ÓPTICO',
      'CONFIGURAÇÃO DE WI-FI',
      'INSTALAÇÃO COMPLETA'
    ];
    const equipTypes = ['MODEM / EMTA', 'ONU GPON', 'DECODER (STB)', 'ROUTER MESH'];
    const modelos = ['HUMAX HGB10R', 'SAGEMCOM FAST 3890', 'HUAWEI HG8245H', 'ZTE F670', 'TP-LINK DECO M4', 'ARRIS TG1692'];
    const janelas = ['MANHÃ (08:00 - 12:00)', 'TARDE (12:00 - 18:00)', 'NOITE (18:00 - 21:00)', 'COMERCIAL (08:00 - 18:00)'];
    const sampleLogins = ['TEC_SILVA', 'TEC_SOUZA', 'TEC_LIMA', 'TEC_ALVES', 'TEC_COSTA', 'TEC_SANTOS', 'TEC_OLIVEIRA', 'TEC_PEREIRA', 'TEC_ROCHA', 'TEC_MARTINS', 'TEC_FERREIRA', 'TEC_GOMES'];

    return {
      id: `extra-${i}`,
      contrato: `003/0${270000 + i * 137}`,
      mes: ['Janeiro', 'Fevereiro', 'Março'][monthIdx],
      fullDate: new Date(2024, monthIdx, day),
      cidade: ['São Paulo', 'Rio de Janeiro', 'Belo Horizonte', 'Curitiba'][Math.floor(Math.random() * 4)],
      area: ['Norte', 'Sul', 'Leste', 'Oeste'][Math.floor(Math.random() * 4)],
      expurgo: Math.random() > 0.8,
      tecnologia: (['HFC', 'GPON', 'HÍBRIDO'] as Technology[])[Math.floor(Math.random() * 3)],
      status: (Math.random() > 0.2 ? 'Executada' : 'Cancelada') as 'Executada' | 'Cancelada',
      notaAT1: Math.random() > 0.2 ? Number((Math.random() * 3 + 7).toFixed(1)) : 0,
      node: `NODE-${Math.floor(Math.random() * 20)}`,
      cdBaixa: `B-${Math.floor(Math.random() * 30)}`,
      descriptionBaixa: descricoes[i % descricoes.length],
      grupoBaixa: ['TÉCNICO', 'CLIENTE', 'INFRA', 'SISTEMA'][Math.floor(Math.random() * 4)],
      terminal: `TERM-${Math.floor(Math.random() * 50)}`,
      volume: 1,
      tipoOs: tipos[i % tipos.length],
      tipoEquipamento: equipTypes[i % equipTypes.length],
      modelo: modelos[i % modelos.length],
      periodoAgenda: janelas[i % janelas.length],
      loginTecnico: sampleLogins[i % sampleLogins.length],
      login: sampleLogins[i % sampleLogins.length]
    };
  })
];

export const MOCK_BASE_CIDADE: BaseCidadeData[] = [
  { cidade: 'Manaus', tecnologia: 'HFC', base: 151887 },
  { cidade: 'Manaus', tecnologia: 'GPON', base: 25903 },
  { cidade: 'Manaus', tecnologia: 'HÍBRIDO', base: 5240 },
  { cidade: 'Manaus', tecnologia: 'OUTROS', base: 719 },
  { cidade: 'Caxias', tecnologia: 'HFC', base: 0 },
  { cidade: 'Caxias', tecnologia: 'GPON', base: 968 },
  { cidade: 'Caxias', tecnologia: 'HÍBRIDO', base: 0 },
  { cidade: 'Caxias', tecnologia: 'OUTROS', base: 4 },
  { cidade: 'Timon', tecnologia: 'HFC', base: 0 },
  { cidade: 'Timon', tecnologia: 'GPON', base: 1044 },
  { cidade: 'Timon', tecnologia: 'HÍBRIDO', base: 0 },
  { cidade: 'Timon', tecnologia: 'OUTROS', base: 1 },
  { cidade: 'São Luís', tecnologia: 'HFC', base: 57471 },
  { cidade: 'São Luís', tecnologia: 'GPON', base: 18650 },
  { cidade: 'São Luís', tecnologia: 'HÍBRIDO', base: 1665 },
  { cidade: 'São Luís', tecnologia: 'OUTROS', base: 270 },
  { cidade: 'Imperatriz', tecnologia: 'HFC', base: 0 },
  { cidade: 'Imperatriz', tecnologia: 'GPON', base: 11957 },
  { cidade: 'Imperatriz', tecnologia: 'HÍBRIDO', base: 0 },
  { cidade: 'Imperatriz', tecnologia: 'OUTROS', base: 59 },
  { cidade: 'Macapá', tecnologia: 'HFC', base: 0 },
  { cidade: 'Macapá', tecnologia: 'GPON', base: 10710 },
  { cidade: 'Macapá', tecnologia: 'HÍBRIDO', base: 0 },
  { cidade: 'Macapá', tecnologia: 'OUTROS', base: 25 },
  { cidade: 'Santana', tecnologia: 'HFC', base: 0 },
  { cidade: 'Santana', tecnologia: 'GPON', base: 5657 },
  { cidade: 'Santana', tecnologia: 'HÍBRIDO', base: 0 },
  { cidade: 'Santana', tecnologia: 'OUTROS', base: 17 },
  { cidade: 'Marabá', tecnologia: 'HFC', base: 0 },
  { cidade: 'Marabá', tecnologia: 'GPON', base: 3149 },
  { cidade: 'Marabá', tecnologia: 'HÍBRIDO', base: 0 },
  { cidade: 'Marabá', tecnologia: 'OUTROS', base: 26 },
  { cidade: 'Parauapebas', tecnologia: 'HFC', base: 0 },
  { cidade: 'Parauapebas', tecnologia: 'GPON', base: 6894 },
  { cidade: 'Parauapebas', tecnologia: 'HÍBRIDO', base: 0 },
  { cidade: 'Parauapebas', tecnologia: 'OUTROS', base: 29 },
  { cidade: 'Ananindeua', tecnologia: 'HFC', base: 12720 },
  { cidade: 'Ananindeua', tecnologia: 'GPON', base: 1407 },
  { cidade: 'Ananindeua', tecnologia: 'HÍBRIDO', base: 11 },
  { cidade: 'Ananindeua', tecnologia: 'OUTROS', base: 46 },
  { cidade: 'Belém', tecnologia: 'HFC', base: 87665 },
  { cidade: 'Belém', tecnologia: 'GPON', base: 22460 },
  { cidade: 'Belém', tecnologia: 'HÍBRIDO', base: 2232 },
  { cidade: 'Belém', tecnologia: 'OUTROS', base: 359 },
  { cidade: 'Castanhal', tecnologia: 'HFC', base: 0 },
  { cidade: 'Castanhal', tecnologia: 'GPON', base: 9627 },
  { cidade: 'Castanhal', tecnologia: 'HÍBRIDO', base: 0 },
  { cidade: 'Castanhal', tecnologia: 'OUTROS', base: 38 },
  { cidade: 'Paragominas', tecnologia: 'HFC', base: 0 },
  { cidade: 'Paragominas', tecnologia: 'GPON', base: 2833 },
  { cidade: 'Paragominas', tecnologia: 'HÍBRIDO', base: 0 },
  { cidade: 'Paragominas', tecnologia: 'OUTROS', base: 19 },
  { cidade: 'Boa Vista', tecnologia: 'HFC', base: 0 },
  { cidade: 'Boa Vista', tecnologia: 'GPON', base: 1003 },
  { cidade: 'Boa Vista', tecnologia: 'HÍBRIDO', base: 0 },
  { cidade: 'Boa Vista', tecnologia: 'OUTROS', base: 0 },
];

export interface BaseAreaData {
  cidade: string;
  area: string;
  tecnologia: Technology;
  base: number;
}

export const MOCK_BASE_AREA: BaseAreaData[] = [
  // BELÉM
  { cidade: 'Belém', area: 'AREA 1', tecnologia: 'GPON', base: 2204 },
  { cidade: 'Belém', area: 'AREA 1', tecnologia: 'HFC', base: 25608 },
  { cidade: 'Belém', area: 'AREA 1', tecnologia: 'HÍBRIDO', base: 318 },
  { cidade: 'Belém', area: 'AREA 1', tecnologia: 'OUTROS', base: 74 },

  { cidade: 'Belém', area: 'AREA 2', tecnologia: 'GPON', base: 7925 },
  { cidade: 'Belém', area: 'AREA 2', tecnologia: 'HFC', base: 21817 },
  { cidade: 'Belém', area: 'AREA 2', tecnologia: 'HÍBRIDO', base: 723 },
  { cidade: 'Belém', area: 'AREA 2', tecnologia: 'OUTROS', base: 76 },

  { cidade: 'Belém', area: 'AREA 3', tecnologia: 'GPON', base: 11936 },
  { cidade: 'Belém', area: 'AREA 3', tecnologia: 'HFC', base: 16228 },
  { cidade: 'Belém', area: 'AREA 3', tecnologia: 'HÍBRIDO', base: 1135 },
  { cidade: 'Belém', area: 'AREA 3', tecnologia: 'OUTROS', base: 69 },

  { cidade: 'Belém', area: 'AREA BELEM', tecnologia: 'GPON', base: 395 },
  { cidade: 'Belém', area: 'AREA BELEM', tecnologia: 'HFC', base: 24012 },
  { cidade: 'Belém', area: 'AREA BELEM', tecnologia: 'HÍBRIDO', base: 56 },
  { cidade: 'Belém', area: 'AREA BELEM', tecnologia: 'OUTROS', base: 88 },

  // ANANINDEUA
  { cidade: 'Ananindeua', area: 'AREA ANANINDEUA', tecnologia: 'GPON', base: 1407 },
  { cidade: 'Ananindeua', area: 'AREA ANANINDEUA', tecnologia: 'HFC', base: 12720 },
  { cidade: 'Ananindeua', area: 'AREA ANANINDEUA', tecnologia: 'HÍBRIDO', base: 11 },
  { cidade: 'Ananindeua', area: 'AREA ANANINDEUA', tecnologia: 'OUTROS', base: 45 },

  // MANAUS
  { cidade: 'Manaus', area: 'MA1', tecnologia: 'GPON', base: 4120 },
  { cidade: 'Manaus', area: 'MA1', tecnologia: 'HFC', base: 24200 },
  { cidade: 'Manaus', area: 'MA1', tecnologia: 'HÍBRIDO', base: 820 },
  { cidade: 'Manaus', area: 'MA1', tecnologia: 'OUTROS', base: 110 },

  { cidade: 'Manaus', area: 'MA2', tecnologia: 'GPON', base: 4804 },
  { cidade: 'Manaus', area: 'MA2', tecnologia: 'HFC', base: 24296 },
  { cidade: 'Manaus', area: 'MA2', tecnologia: 'HÍBRIDO', base: 494 },
  { cidade: 'Manaus', area: 'MA2', tecnologia: 'OUTROS', base: 104 },

  { cidade: 'Manaus', area: 'MA3', tecnologia: 'GPON', base: 7610 },
  { cidade: 'Manaus', area: 'MA3', tecnologia: 'HFC', base: 20603 },
  { cidade: 'Manaus', area: 'MA3', tecnologia: 'HÍBRIDO', base: 1794 },
  { cidade: 'Manaus', area: 'MA3', tecnologia: 'OUTROS', base: 107 },

  { cidade: 'Manaus', area: 'MA4', tecnologia: 'GPON', base: 2732 },
  { cidade: 'Manaus', area: 'MA4', tecnologia: 'HFC', base: 27451 },
  { cidade: 'Manaus', area: 'MA4', tecnologia: 'HÍBRIDO', base: 602 },
  { cidade: 'Manaus', area: 'MA4', tecnologia: 'OUTROS', base: 128 },

  { cidade: 'Manaus', area: 'MA5', tecnologia: 'GPON', base: 6637 },
  { cidade: 'Manaus', area: 'MA5', tecnologia: 'HFC', base: 35337 },
  { cidade: 'Manaus', area: 'MA5', tecnologia: 'HÍBRIDO', base: 1530 },
  { cidade: 'Manaus', area: 'MA5', tecnologia: 'OUTROS', base: 170 },

  // SÃO LUÍS
  { cidade: 'São Luís', area: 'AREA 1', tecnologia: 'GPON', base: 2515 },
  { cidade: 'São Luís', area: 'AREA 1', tecnologia: 'HFC', base: 12301 },
  { cidade: 'São Luís', area: 'AREA 1', tecnologia: 'HÍBRIDO', base: 6 },
  { cidade: 'São Luís', area: 'AREA 1', tecnologia: 'OUTROS', base: 58 },

  { cidade: 'São Luís', area: 'AREA 2', tecnologia: 'GPON', base: 7362 },
  { cidade: 'São Luís', area: 'AREA 2', tecnologia: 'HFC', base: 12693 },
  { cidade: 'São Luís', area: 'AREA 2', tecnologia: 'HÍBRIDO', base: 890 },
  { cidade: 'São Luís', area: 'AREA 2', tecnologia: 'OUTROS', base: 71 },

  { cidade: 'São Luís', area: 'AREA 3', tecnologia: 'GPON', base: 5006 },
  { cidade: 'São Luís', area: 'AREA 3', tecnologia: 'HFC', base: 24764 },
  { cidade: 'São Luís', area: 'AREA 3', tecnologia: 'HÍBRIDO', base: 74 },
  { cidade: 'São Luís', area: 'AREA 3', tecnologia: 'OUTROS', base: 187 },

  { cidade: 'São Luís', area: 'AREA 04', tecnologia: 'GPON', base: 3767 },
  { cidade: 'São Luís', area: 'AREA 04', tecnologia: 'HFC', base: 7713 },
  { cidade: 'São Luís', area: 'AREA 04', tecnologia: 'HÍBRIDO', base: 695 },
  { cidade: 'São Luís', area: 'AREA 04', tecnologia: 'OUTROS', base: 0 },

  // DEMAIS PRAÇAS NORTE
  { cidade: 'Macapá', area: 'AREA MACAPA', tecnologia: 'GPON', base: 10710 },
  { cidade: 'Macapá', area: 'AREA MACAPA', tecnologia: 'HFC', base: 0 },
  { cidade: 'Macapá', area: 'AREA MACAPA', tecnologia: 'HÍBRIDO', base: 0 },
  { cidade: 'Macapá', area: 'AREA MACAPA', tecnologia: 'OUTROS', base: 25 },

  { cidade: 'Santana', area: 'AREA SANTANA', tecnologia: 'GPON', base: 5657 },
  { cidade: 'Santana', area: 'AREA SANTANA', tecnologia: 'HFC', base: 0 },
  { cidade: 'Santana', area: 'AREA SANTANA', tecnologia: 'HÍBRIDO', base: 0 },
  { cidade: 'Santana', area: 'AREA SANTANA', tecnologia: 'OUTROS', base: 17 },

  { cidade: 'Marabá', area: 'AREA MARABA', tecnologia: 'GPON', base: 3149 },
  { cidade: 'Marabá', area: 'AREA MARABA', tecnologia: 'HFC', base: 0 },
  { cidade: 'Marabá', area: 'AREA MARABA', tecnologia: 'HÍBRIDO', base: 0 },
  { cidade: 'Marabá', area: 'AREA MARABA', tecnologia: 'OUTROS', base: 26 },

  { cidade: 'Parauapebas', area: 'AREA PARAUAPEBA', tecnologia: 'GPON', base: 6894 },
  { cidade: 'Parauapebas', area: 'AREA PARAUAPEBA', tecnologia: 'HFC', base: 0 },
  { cidade: 'Parauapebas', area: 'AREA PARAUAPEBA', tecnologia: 'HÍBRIDO', base: 0 },
  { cidade: 'Parauapebas', area: 'AREA PARAUAPEBA', tecnologia: 'OUTROS', base: 29 },

  { cidade: 'Castanhal', area: 'AREA CASTANHAL', tecnologia: 'GPON', base: 9627 },
  { cidade: 'Castanhal', area: 'AREA CASTANHAL', tecnologia: 'HFC', base: 0 },
  { cidade: 'Castanhal', area: 'AREA CASTANHAL', tecnologia: 'HÍBRIDO', base: 0 },
  { cidade: 'Castanhal', area: 'AREA CASTANHAL', tecnologia: 'OUTROS', base: 38 },

  { cidade: 'Paragominas', area: 'AREA PARAGOMINA', tecnologia: 'GPON', base: 2833 },
  { cidade: 'Paragominas', area: 'AREA PARAGOMINA', tecnologia: 'HFC', base: 0 },
  { cidade: 'Paragominas', area: 'AREA PARAGOMINA', tecnologia: 'HÍBRIDO', base: 0 },
  { cidade: 'Paragominas', area: 'AREA PARAGOMINA', tecnologia: 'OUTROS', base: 19 },

  { cidade: 'Timon', area: 'AREA TIMON', tecnologia: 'GPON', base: 1044 },
  { cidade: 'Timon', area: 'AREA TIMON', tecnologia: 'HFC', base: 0 },
  { cidade: 'Timon', area: 'AREA TIMON', tecnologia: 'HÍBRIDO', base: 0 },
  { cidade: 'Timon', area: 'AREA TIMON', tecnologia: 'OUTROS', base: 1 },

  { cidade: 'Caxias', area: 'AREA CAXIAS', tecnologia: 'GPON', base: 968 },
  { cidade: 'Caxias', area: 'AREA CAXIAS', tecnologia: 'HFC', base: 0 },
  { cidade: 'Caxias', area: 'AREA CAXIAS', tecnologia: 'HÍBRIDO', base: 0 },
  { cidade: 'Caxias', area: 'AREA CAXIAS', tecnologia: 'OUTROS', base: 4 },

  { cidade: 'Boa Vista', area: 'AREA BOA VISTA', tecnologia: 'GPON', base: 1003 },
  { cidade: 'Boa Vista', area: 'AREA BOA VISTA', tecnologia: 'HFC', base: 0 },
  { cidade: 'Boa Vista', area: 'AREA BOA VISTA', tecnologia: 'HÍBRIDO', base: 0 },
  { cidade: 'Boa Vista', area: 'AREA BOA VISTA', tecnologia: 'OUTROS', base: 0 },

  { cidade: 'Imperatriz', area: 'AREA IMPERATRIZ', tecnologia: 'GPON', base: 11957 },
  { cidade: 'Imperatriz', area: 'AREA IMPERATRIZ', tecnologia: 'HFC', base: 0 },
  { cidade: 'Imperatriz', area: 'AREA IMPERATRIZ', tecnologia: 'HÍBRIDO', base: 0 },
  { cidade: 'Imperatriz', area: 'AREA IMPERATRIZ', tecnologia: 'OUTROS', base: 59 },
];

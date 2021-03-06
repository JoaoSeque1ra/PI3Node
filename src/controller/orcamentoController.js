const { DECIMAL, or } = require("sequelize");
const sequelize = require("../config/Database");

const Cliente = require("../model/Cliente");
const Contem = require("../model/Contem");
const DescricaoServico = require("../model/DescricaoServico");
const EstadoPedido = require("../model/EstadoPedido");
const Orcamento = require("../model/Orcamento");
const Servico = require("../model/Servico");
const TipoServico = require("../model/TipoServico");

sequelize.sync({
    // force:true
})

module.exports = {
    //------------Estados------------------
    async estadosServico(req, res) {
        await EstadoPedido.findAll()
            .then((data) => {
                if (data != null)
                    return res.json({ success: true, message: "Lista de estados enviada", data: data })

                res.json({ success: false, message: "Não existe Estados disponíveis" });
            })
            .catch(err => {
                console.log("Erro no listServicosComunicacaoConsultoria " + err);
                res.json({ success: false, message: err.message });
            })
    },

    //------------Serviços------------------
    //---------Listar--------------
    async listDescricaoServicos(req, res) {
        const { id } = req.params

        await DescricaoServico.findAll({
            include: [{
                model: Servico,
                where: {
                    tipo_servico_id: id
                }
            }],
            order: ["id"]
        })
            .then((data) => {
                res.json({ success: true, message: "Lista de Descrição de serviços enviada", data: data })
            })
            .catch(err => {
                console.log("Erro no listServicosComunicacaoConsultoria " + err);
                res.json({ success: false, message: err.message });
            })
    },

    //---------Update--------------
    async updateDescricaoServicos(req, res) {
        const { id } = req.params

        const { novoPreco } = req.body

        await DescricaoServico.update({
            preco: novoPreco
        }, {
            where: { id: id },
            returning: true
        })
            .then((data) => {
                res.json({ success: true, message: "Lista de Descrição de serviços foi atualizada", data: data })
            })
            .catch(err => {
                console.log("Erro no listServicosComunicacaoConsultoria " + err);
                res.json({ success: false, message: err.message });
            })
    },

    //------------Orçamento------------------
    //Listar Orçamentos
    async listOrcamentos(req, res) {
        await Orcamento.findAll({
            include: [{
                model: Contem,

                include: [{
                    model: DescricaoServico,
                }]
            }, Cliente, EstadoPedido]
        })
            .then((data) => {
                if (data != "")
                    return res.json({ success: true, message: "Lista de orçamentos enviada", data: data });

                res.json({ success: false, message: "Não existe Orçamentos disponíveis" });
            })
            .catch(err => {
                console.log("Erro no listOrçamento " + err);
                res.json({ success: false, message: err.message });
            })
    },

    //Encontra Orçamento através do Id
    async getOrcamento(req, res) {
        const { id } = req.params; //vai buscar o que esta no url

        await Orcamento.findOne({
            where: { id: id },
            include: [{
                model: Contem,

                include: [{
                    model: DescricaoServico,
                }]
            }, Cliente, EstadoPedido]
        })
            .then((data) => {
                if (data != null)
                    return res.json({ success: true, message: "Orçamento encontrado", data: data });

                res.json({ success: false, message: "Orçamento não existe" });
            })
            .catch(err => {
                console.log("Erro no getOrcamento: " + err);
                res.json({ success: false, message: err.message });
            });
    },

    async createOrcamentoNew(req, res) {
        const { idCliente, idDescricao, quantidade } = req.body

        // const cliente = await Cliente.findOne({
        //     where: { id: idCliente }
        // })

        const orcamento = await Orcamento.create({
            valor: 0
        })

        const servicos = idDescricao.split(",")
        console.log(servicos.length)

        const quantidadeServico = quantidade.split(",")
        console.log(quantidade.length)

        let valorFinal = 0

        servicos.map(async (data, index) => {
            const descricao = await DescricaoServico.findOne({
                where: { id: data }
            })
                .then((data) => {
                    valorFinal += parseFloat(data.preco)
                    return data
                })

            const contem = await Contem.create({
                orcamento_id: orcamento.id,
                descricao_servico_id: descricao.id,
                quantidade: quantidadeServico[index],
                valor: descricao.preco,
            })

            //Na ultima passagem faz
            if (servicos.length - 1 == index) {
                orcamento.valor = valorFinal
                orcamento.estado_pedido_id = 1
                orcamento.cliente_id = idCliente

                await orcamento.save()

                await Orcamento.findOne({ where: { id: orcamento.id } })
                    .then((data) => {
                        res.json({ success: true, message: "Criado com sucesso um novo Orçamento", data: data });
                        return data
                    })
                    .catch(err => {
                        console.log("Erro no createOrcamento: " + err);
                        res.json({ success: false, message: err.message });
                    })
            }

        })
    },

    //Criar Orçamento
    async createOrcamento(req, res) {
        const { clientNome, estado, nomeDescricaoProduto } = req.body;

        //Encontrar Cliente em relação ao nome(vem do frontend)
        //Pode levar update e mandar apenas o id(do frontend)
        const clientId = await Cliente.findOne({
            where: { nome: clientNome }
        })
        console.log("Dados do Cliente: " + clientId.dataValues)

        //Encontrar Estado em relação ao estado(vem do frontend)
        //Pode levar update e mandar apenas o id(do frontend)
        const estadoId = await EstadoPedido.findOne({
            where: { estado: estado }
        })
        console.log("Estado do pedido: " + estadoId.dataValues)

        console.log("Vou criar o Orçamento");
        const orcamento = await Orcamento.create({
            estado_pedido_id: estadoId.id,
            cliente_id: clientId.id,
            valor: 0,
        })

        console.log("Vou separar as descrições dos produtos")
        const servicos = nomeDescricaoProduto.split(",")
        console.log(servicos)

        console.log("Vou adicionar descrição do produto")

        let somar = 0;
        Object.keys(servicos).map(async (key) => {
            console.log(servicos[key])

            const descricao = await DescricaoServico.findOne({
                where: { descricao: servicos[key] }
            })
                .then((data) => {
                    somar += parseFloat(data.preco)
                    console.log(somar)
                    return data
                })
                .catch(err => {
                    console.log(err.message)
                })

            await Contem.create({
                orcamento_id: orcamento.id,
                descricao_servico_id: descricao.id,
                quantidade: 1,
                valor: descricao.preco,
            })

            //Na ultima passagem faz
            if (servicos.length - 1 == key) {
                orcamento.valor = somar

                await orcamento.save()

                await Orcamento.findOne({ where: { id: orcamento.id } })
                    .then((data) => {
                        res.json({ success: true, message: "Criado com sucesso um novo Orçamento", data: data });
                        return data
                    })
                    .catch(err => {
                        console.log("Erro no createOrcamento: " + err);
                        res.json({ success: false, message: err.message });
                    })
            }
        })
    },

    async updateOrcamentoValor(req, res) {
        const { id } = req.params
        console.log(id)

        const { estado, descricaoServicosId, quantidade, valorServico } = req.body

        const novoEstado = await EstadoPedido.findOne({
            where: { estado: estado }
        })

        const servicoAntigo = await Contem.findAll({
            where: {
                orcamento_id: id,
                descricao_servico_id: descricaoServicosId
            }
        })

        await Contem.update({
            quantidade: quantidade,
            valor: valorServico
        }, {
            where: {
                orcamento_id: id,
                descricao_servico_id: descricaoServicosId
            },
            returning: true
        })

        const servicoNovo = await Contem.findAll({
            where: {
                orcamento_id: id,
                descricao_servico_id: descricaoServicosId
            }
        })

        const OrcamentoAntigo = await Orcamento.findAll({
            where: { id: id }
        })

        console.log(OrcamentoAntigo[0].dataValues.valor)
        console.log(descricaoServicosId)
        let valor = parseFloat(OrcamentoAntigo[0].dataValues.valor) - parseFloat(servicoAntigo[0].dataValues.valor) * parseInt(servicoAntigo[0].quantidade)

        let valorNovo = valor + parseFloat(servicoNovo[0].dataValues.valor) * parseInt(quantidade)

        console.log(valor)
        console.log(valorNovo)

        await Orcamento.update({
            valor: parseFloat(valorNovo).toFixed(2),
            estado_pedido_id: novoEstado.id
        }, {
            where: { id: id },
            returning: true
        })
            .then((data) => {
                res.json({ success: true, message: "Atualizado valores do orçamento com sucesso", data: data });
            })
            .catch(err => {
                console.log("Erro no updateOrcamentoValor: " + err);
                res.json({ success: false, message: err.message });
            })
    },

    //Update Orçamento
    async updateOrcamento(req, res) {
        const { id } = req.params;

        console.log("Id do orçamento: " + id)

        const { estado, nomeDescricaoProduto, quantidadeServico } = req.body

        //Encontrar Estado em relação ao estado(vem do frontend)
        //Pode levar update e mandar apenas o id(do frontend)
        const estadoId = await EstadoPedido.findOne({
            where: { estado: estado }
        })
        console.log("Estado do pedido: " + estadoId.dataValues)

        console.log("Vou editar o Orçamento");
        await Orcamento.update(
            {
                estado_pedido_id: estadoId.id
            }, {
            where: { id: id },
            returning: true
        })

        await Contem.destroy({
            where: {
                orcamento_id: id
            }
        })

        console.log("Vou separar as descrições dos produtos")
        const servicos = nomeDescricaoProduto.split(",")
        console.log(servicos)

        console.log("Vou adicionar descrição do produto")

        let somar = 0;
        Object.keys(servicos).map(async (key) => {
            console.log(servicos[key])

            const descricao = await DescricaoServico.findOne({
                where: { descricao: servicos[key] }
            })
                .then((data) => {
                    somar += parseFloat(data.preco)
                    console.log(somar)
                    return data
                })
                .catch(err => {
                    console.log(err.message)
                })

            await Contem.create({
                orcamento_id: id,
                descricao_servico_id: descricao.id,
                quantidade: quantidadeServico,
                valor: descricao.preco,
            })

            //Na ultima passagem faz
            if (servicos.length - 1 == key) {
                const orcamento = await Orcamento.findOne({ where: { id: id } })

                orcamento.valor = somar
                await orcamento.save()

                await Orcamento.findOne({ where: { id: id } })
                    .then((data) => {
                        res.json({ success: true, message: "Criado com sucesso um novo Orçamento", data: data });
                    })
                    .catch(err => {
                        console.log("Erro no createOrcamento: " + err);
                        res.json({ success: false, message: err.message });
                    })
            }
        })
    },

    //------------Clientes------------------
    //Listar Clientes
    async listClients(req, res) {
        await Cliente.findAll({ include: Orcamento })
            .then(function (data) {
                res.json({ success: true, message: "Lista de clientes enviada", data: data });
                return data
            })
            .catch(err => {
                console.log("Erro no listClientes " + err);
                res.json({ success: false, message: err.message });
            });
    },

    //Encontra Cliente by Id
    async getClients(req, res) {
        const { id } = req.params; //vai buscar o que esta no url

        await Cliente.findOne({
            where: { id: id }
        })
            .then((data) => {
                if (data != null)
                    res.json({ success: true, message: "Cliente encontrado", data: data });
                else
                    res.json({ success: false, message: "Client não existe" });
            })
            .catch(err => {
                console.log("Erro no getClient: " + err);
                res.json({ success: false, message: err.message });
            });
    },

    //Não sei se é util!!
    async findOrcamentoFromClient(req, res) {
        const { id } = req.params

        await Cliente.findAll({
            where: { id: id },
            include: Orcamento
        })
            .then((data) => {
                res.json({ success: true, message: "Cliente encontrado", data: data });
            })
            .catch(err => {
                res.json({ success: false, message: err.message });
            })
    },

    //Criar clientes
    async createClient(req, res) {
        const { nome, telefone, email, empresa, morada, codigo_postal, localidade, numero_fiscal } = req.body;

        await Cliente.findOne({where: {
            email: email,
            nome: nome,
            telefone: telefone
        }})
        .then(async (data) => {
            if(data === null) {
                return await Cliente.create({
                    nome: nome,
                    telefone: telefone,
                    email: email,
                    empresa: empresa,
                    morada: morada,
                    codigo_postal: codigo_postal,
                    localidade: localidade,
                    numero_fiscal: numero_fiscal
                })
                    .then((data) => {
                        res.json({ success: true, message: "Criado com sucesso um novo cliente", data: data });
                    })
                    .catch(err => {
                        console.log("Erro no createClient: " + err);
                        res.json({ success: false, message: err.message });
                    });
            }

            res.json({ success: true, message: "Cliente ja existe", data: data });
        })
        


        
    },

    //Update clientes
    async updateClient(req, res) {
        const { id } = req.params;

        const { nome, telefone, email, empresa, morada, codigo_postal, localidade, numero_fiscal } = req.body;

        await Cliente.update({
            nome: nome,
            telefone: telefone,
            email: email,
            empresa: empresa,
            morada: morada,
            codigo_postal: codigo_postal,
            localidade: localidade,
            numero_fiscal: numero_fiscal
        }, {
            where: { id: id },
            returning: true
        })
            .then((data) => {
                res.json({ success: true, message: "Atualizou com sucesso o cliente", data: data })
            })
            .catch(err => {
                console.log("Erro no updateClient: " + err);
                res.json({ success: false, message: err.message });
            })
    },

}
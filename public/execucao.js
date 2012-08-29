var CODE; 
var MEMORIA = new Array(4096);
var END = 0;
var LINHA = 0;
var EXECUTAR = false; //VARIAVEL DIZ SE O EMULADOR ESTA EXECUTANDO O CODIDO, PARA IMPEDIR QUE ELE ADICIONE OS OPCODES NOVAMENTE
var MONTAGEM_OK;
	
/**
* Atualiza os valores dos registradores na interface
*/
function AtualizaDados() 
{
	var flags = document.getElementById("Flag");
	var ns = "";
	ns += "I: -  <br />";
	ns += "T: -  <br/>";
	ns += "H: -  <br/>";
	ns += "S: "+AVR328.S+"  <br/>";
	ns += "V: "+AVR328.V+"  <br/>";
	ns += "N: "+AVR328.N+"  <br/>";
	ns += "Z: "+AVR328.Z+"  <br/>";
	ns += "C: "+AVR328.C+"  <br/>";
	
	flags.innerHTML = ns;
	flags = document.getElementById("Reg");
	ns= "";
	for(var i=0;i<32;i++)
	{
		if(i<10)
			ns+= "R"+i+" : "+ AVR328.R[i];
		else
			ns+= "R"+i+": "+ AVR328.R[i];
		ns+="<br />";
	}
	flags.innerHTML = ns;
	
}
/**
* Modifica o texto da div 'opcode', para limpar a div basta enviar '""'
* @param {string} Binarios das intruções
*/
function ConsoleBin(s)
{
	var CampoOpCODE = document.getElementById("opcode");
	if(s != "")
	{
		CampoOpCODE.value = s+"\n";
	}
	else
		CampoOpCODE.value = s;
}
/**
* Modifica o texto da div 'erros', para limpar a div basta enviar '""'
* @param {string} um erro
*/
function ConsoleBinErro(s)
{
	var CampoOpCODE = document.getElementById("erros");
	if(s != "")
	{
		CampoOpCODE.value += s+"\n";
	}
	else
		CampoOpCODE.value = s;
}
/**
* Insere um byte na memória em Binario
* @param {string}
*/
function InsereMemoria(s)
{
	if(!EXECUTAR)
	{
		spl = Trim(s);
		if(spl.length <=19)
		{
			MEMORIA[END] = spl.substring(0,9);
			END++;
			MEMORIA[END] = spl.substring(10);
			END++;
		}else
		{
			var s1 = spl.substring(0,9);
			var s2 = spl.substring(10,19);
			var s3 = spl.substring(20,29);
			var s4 = spl.substring(30);
			MEMORIA[END] = s1;
			END++;
			MEMORIA[END] = s2;
			END++;
			MEMORIA[END] = s3;
			END++;
			MEMORIA[END] = s4;
			END++;
			
		}
	}
}
/**
* Mostra o conteúdo da variável MEMÓRIA na interface
* @see ConsoleBin() 
*/
function MostraMemoria()
{
	ConsoleBin("");
	var s = "";
	for(var i=0;i<4096;i++)
		if(i<16)
			s += "0x00"+i.toString(16)+": "+MEMORIA[i]+'\n';
		else if(i>=16 && i<256)
				s += "0x0"+i.toString(16)+": "+MEMORIA[i]+'\n';
			 else
				s += "0x"+i.toString(16)+": "+MEMORIA[i]+'\n';
			
	ConsoleBin(s);
}
/**
* Inicializa a interface, processador e/ou memória
* @param {integer} tipo = 0(inicializa TUDO);tipo = 1(inicializa o processador, não a memória)
*/
function inicializa(tipo)
{
	
	var comandos = AVR328.Commands;
	AVR328 = new CAVR328;
	AVR328.Commands = comandos;
	for(var i=0;i<32;i++)
		AVR328.R[i] = 0;
	if(tipo == 0)
	{
		ConsoleBin("");
		for(var i=0;i<4096;i++)
			MEMORIA[i] = "0000 0000";
	}
	END = 0;
	AtualizaDados();
	
	if(MONTAGEM_OK)
	{
		document.getElementById("btn_Executa").disabled = false;
		document.getElementById("btn_Frente").disabled = false;
	}
	else
	{
		document.getElementById("btn_Executa").disabled = true;
		document.getElementById("btn_Frente").disabled = true;
	}
}
/**
* Converte os mnemonicos em opcodes, alterando memória , verifica a sintaxe
*/
function Montar()
{
	linhas();
	
	ConsoleBinErro("");
	MONTAGEM_OK = true;
	EXECUTAR = false;
	inicializa(0)
	LINHA=0;
	document.getElementById("linha").value = "Linha: " +AVR328.PC;
	var CampoOpCODE = document.getElementById("opcode");


	CODE = document.getElementById("CODE").value.split("\n");//Coloca uma linha em cada indice do vetor
	while(LINHA < CODE.length)
	{
		
		CODE[LINHA] = Trim(CODE[LINHA]) // tira espaços iniciais e finais do comando
		var CodSemComentario = CODE[LINHA].split(";");
		CODE[LINHA] = CodSemComentario[0];
		//******************************************************************
		//****************************Normaliza Comando*********************
		var c = CODE[LINHA].toUpperCase();//separa a instrução do parametros
		// part[0] está com CCC Rd,KK
		//Este laço deixa com 1 espaço entre o CCC e Rd. Ex: LDI      R10,10 ->após o laço-> LDI R10,10
		var i =0;
		do{
			if(c.substr(i,1) == ' ')
			{
			
				if(c.substr(i+1,1) == ' ')
				{
					c = c.substring(0,i+1) + c.substring(i+2); 
					
				}else
					break;
			}
			else
				i++;
		}while(i < c.length);
		var part = new Array(2);
		part[0] = c.substring(0,i);
		part[1] = c.substring(i+1);
		//***************************Fim da Normalização********************
		//******************************************************************
		
		//se for uma label, pula para proxima linha 
		if(part[0].indexOf(":") >= 0 || part[0]=="")
			LINHA++;
		else{
			var encontrado = false;
			for(var i in AVR328.Commands)
			{
				if(AVR328.Commands[i].asm.toUpperCase() == part[0]) //Pesquisa o comando
				{
					encontrado = true;
					if(AVR328.Commands[i].Command(TrimAll(part[1]),0) == 1) // Chama a ação do comando passando os parametros do comando
					{
						ConsoleBinErro("Erro na linha "+ (parseInt(LINHA)+1)+" : Parametro da instrucao "+AVR328.Commands[i].asm.toUpperCase()+"  incorreto.");
						MONTAGEM_OK = false;
						break;
					}
					
					MostraMemoria();
					AtualizaDados();
					break;
				}
					
			}
			if(!encontrado)
			{
				MONTAGEM_OK = false;
				ConsoleBinErro("Instrucao desconhecida! Linha:"+ (parseInt(LINHA)+1));
				break;
			}
		
		
			LINHA++;
			
		}
	}
	
	inicializa(1); // Limpa o estado do processador, pois esta função é apenas para gerar os opcodes.
	
}		
/**
* Executa o código que foi montado
*/
function Executar()
{
	ConsoleBinErro("");
	EXECUTAR = true;
	inicializa(1);
	while(AVR328.PC < CODE.length)
	{
		
		//******************************************************************
		//****************************Normaliza Comando*********************
		var c = CODE[AVR328.PC].toUpperCase();//separa a instrução do parametros
		// part[0] está com CCC Rd,KK
		//Este laço deixa com 1 espaço entre o CCC e Rd. Ex: LDI      R10,10 ->após o laço-> LDI R10,10
		var i =0;
		do{
			if(c.substr(i,1) == ' ')
			{
			
				if(c.substr(i+1,1) == ' ')
				{
					c = c.substring(0,i+1) + c.substring(i+2); 
					
				}else
					break;
			}
			else
				i++;
		}while(i < c.length);
		var part = new Array(2);
		part[0] = c.substring(0,i);
		part[1] = c.substring(i+1);
		//***************************Fim da Normalização********************
		//******************************************************************
		
		//se for uma label, pula para proxima linha 
		if(part[0].indexOf(":") >= 0 || part[0]=="")
			AVR328.PC++;
		else
		{
			var encontrado = false;
			for(var i in AVR328.Commands)
			{
				if(AVR328.Commands[i].asm.toUpperCase() == part[0]) //Pesquisa o comando
				{
					if(AVR328.Commands[i].Command(TrimAll(part[1]),1) == 1) // Chama a ação do comando passando os parametros do comando
					{
						ConsoleBinErro("Erro na linha "+ (parseInt(AVR328.PC)+1));
						AVR328.PC++;
					}
					encontrado = true;
					MostraMemoria();
					AtualizaDados();
					break;
				}
					
			}
			if(!encontrado)
			{
				ConsoleBinErro("Instrucao desconhecida! Linha:"+ (parseInt(AVR328.PC)+1));

			}
		
		}
			
	}
	EXECUTAR = false;
}		
/**
*Executa o código linha por linha
*/
function Passo()
{
	//ConsoleBinErro("");
	EXECUTAR = true;
	//inicializa(1);
	//******************************************************************
	//****************************Normaliza Comando*********************
	var c = CODE[AVR328.PC].toUpperCase();//separa a instrução do parametros
	// part[0] está com CCC Rd,KK
	//Este laço deixa com 1 espaço entre o CCC e Rd. Ex: LDI      R10,10 ->após o laço-> LDI R10,10
	var i =0;
	do{
		if(c.substr(i,1) == ' ')
		{
		
			if(c.substr(i+1,1) == ' ')
			{
				c = c.substring(0,i+1) + c.substring(i+2); 
				
			}else
				break;
		}
		else
			i++;
	}while(i < c.length);
	var part = new Array(2);
	part[0] = c.substring(0,i);
	part[1] = c.substring(i+1);
	//***************************Fim da Normalização********************
	//******************************************************************
	
	//se for uma label, pula para proxima linha 
	if(part[0].indexOf(":") >= 0 || part[0]=="")
		AVR328.PC++;
	else
	{
		var encontrado = false;
		for(var i in AVR328.Commands)
		{
			if(AVR328.Commands[i].asm.toUpperCase() == part[0]) //Pesquisa o comando
			{
				if(AVR328.Commands[i].Command(TrimAll(part[1]),1) == 1) // Chama a ação do comando passando os parametros do comando
				{
					ConsoleBinErro("Erro na linha "+ (parseInt(AVR328.PC)+1));
					AVR328.PC++;
					break;
					
				}
				encontrado = true;
				MostraMemoria();
				AtualizaDados();
				break;
			}
				
		}
		if(!encontrado)
		{
			ConsoleBinErro("Instrucao desconhecida! Linha:"+ (parseInt(AVR328.PC)+1));
		}
	
	}
	if((AVR328.PC) >= CODE.length)
		document.getElementById("btn_Frente").disabled = true;
	
	document.getElementById("linha").value = "Linha: " +AVR328.PC;
	linhas(AVR328.PC);
}		
/**
* Gera o numero das linhas e destaca a linha em execução
*/
function linhas(l)
{
	var ns="";
	if(!l)
		l=0;
	for(var i=1;i<100;i++)
	{
		if(l==i)
		{
			ns+="<span style='color:white;background-color:black;'>"+i+"</span><br />";
		}else
			ns+=i+"<br />";
	}
	document.getElementById("linhas").innerHTML = ns;
}
function scroolCode()
{
	document.getElementById("linhas").scrollTop = document.getElementById("CODE").scrollTop;
}


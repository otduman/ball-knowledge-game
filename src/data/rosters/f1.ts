import { parseRoster } from '../parse';

/**
 * Format: Name | Country | pop | aliases (semicolon separated)
 *
 * Drivers are placed by the licence they raced under. Nico Rosberg therefore
 * sits in Western Europe (German licence) rather than the Nordic region, and
 * John Love and Sam Tingle are filed under Zimbabwe for what was then Rhodesia.
 */
export const F1 = parseRoster(
  'f1',
  `
# ---- Africa ----
Jody Scheckter|South Africa|25
Ian Scheckter|South Africa|4
Tony Maggs|South Africa|3
Dave Charlton|South Africa|2
John Love|Zimbabwe|2
Desire Wilson|South Africa|2|Desiré Wilson
Eddie Keizan|South Africa|1
Basil van Rooyen|South Africa|1
Luki Botha|South Africa|1
Peter de Klerk|South Africa|1
Sam Tingle|Zimbabwe|1
Brausch Niemann|South Africa|1

# ---- South America ----
Ayrton Senna|Brazil|45
Juan Manuel Fangio|Argentina|25
Juan Pablo Montoya|Colombia|15
Franco Colapinto|Argentina|15
Rubens Barrichello|Brazil|12
Felipe Massa|Brazil|10
Nelson Piquet|Brazil|10
Emerson Fittipaldi|Brazil|8
Pastor Maldonado|Venezuela|8
Gabriel Bortoleto|Brazil|6
Carlos Reutemann|Argentina|5
Felipe Nasr|Brazil|3
Bruno Senna|Brazil|3
Lucas di Grassi|Brazil|2
Nelson Piquet Jr.|Brazil|2
Christian Fittipaldi|Brazil|2
Carlos Pace|Brazil|2
Jose Froilan Gonzalez|Argentina|2|José Froilán González
Ricardo Zonta|Brazil|1
Gaston Mazzacane|Argentina|1|Gastón Mazzacane
Norberto Fontana|Argentina|1
Esteban Tuero|Argentina|1
Pedro Diniz|Brazil|1
Roberto Moreno|Brazil|1

# ---- North America ----
Sergio Perez|Mexico|20|Checo Perez; Sergio Pérez
Mario Andretti|United States|15
Jacques Villeneuve|Canada|12
Gilles Villeneuve|Canada|10
Lance Stroll|Canada|8
Logan Sargeant|United States|8
Dan Gurney|United States|5
Nicholas Latifi|Canada|5
Phil Hill|United States|4
Alexander Rossi|United States|3
Michael Andretti|United States|3
Pedro Rodriguez|Mexico|3|Pedro Rodríguez
Esteban Gutierrez|Mexico|3|Esteban Gutiérrez
Scott Speed|United States|2
Eddie Cheever|United States|2
Ricardo Rodriguez|Mexico|2|Ricardo Rodríguez
Peter Revson|United States|1
Richie Ginther|United States|1
Masten Gregory|United States|1
Hector Rebaque|Mexico|1|Héctor Rebaque

# ---- UK & Ireland ----
Lewis Hamilton|England|55
Lando Norris|England|35
George Russell|England|25
Jenson Button|England|20
Nigel Mansell|England|12
David Coulthard|Scotland|8
Jackie Stewart|Scotland|8
Damon Hill|England|8
James Hunt|England|8
Stirling Moss|England|6
Jim Clark|Scotland|6
Graham Hill|England|5
Oliver Bearman|England|5
Eddie Irvine|Northern Ireland|4
John Surtees|England|4
Martin Brundle|England|3
Johnny Herbert|England|2
Paul di Resta|Scotland|2
Mike Hawthorn|England|2
John Watson|Northern Ireland|2
Max Chilton|England|1
Jolyon Palmer|England|1
Ralph Firman|Ireland|1
Derek Daly|Ireland|1
Peter Collins|England|1
Tony Brooks|England|1
Allan McNish|Scotland|1
Anthony Davidson|England|1
Justin Wilson|England|1

# ---- Western Europe ----
Max Verstappen|Netherlands|50
Michael Schumacher|Germany|45
Sebastian Vettel|Germany|30
Charles Leclerc|Monaco|30
Alain Prost|France|20
Niki Lauda|Austria|20
Nico Rosberg|Germany|15
Nico Hulkenberg|Germany|12|Nico Hülkenberg
Esteban Ocon|France|12
Pierre Gasly|France|12
Mick Schumacher|Germany|8
Romain Grosjean|France|8
Isack Hadjar|France|8
Gerhard Berger|Austria|6
Jochen Rindt|Austria|5
Jos Verstappen|Netherlands|5
Ralf Schumacher|Germany|4
Jean Alesi|France|4
Jacky Ickx|Belgium|4
Nyck de Vries|Netherlands|4
Heinz-Harald Frentzen|Germany|3
Nick Heidfeld|Germany|3
Stoffel Vandoorne|Belgium|3
Clay Regazzoni|Switzerland|3
Sebastien Buemi|Switzerland|3|Sébastien Buemi
Timo Glock|Germany|2
Adrian Sutil|Germany|2
Pascal Wehrlein|Germany|2
Rene Arnoux|France|2|René Arnoux
Didier Pironi|France|2
Francois Cevert|France|2|François Cevert
Olivier Panis|France|2
Jean-Eric Vergne|France|2|Jean-Éric Vergne
Thierry Boutsen|Belgium|2
Alexander Wurz|Austria|2
Jo Siffert|Switzerland|2
Jacques Laffite|France|1
Wolfgang von Trips|Germany|1
Jochen Mass|Germany|1
Stefan Bellof|Germany|1
Giedo van der Garde|Netherlands|1
Christijan Albers|Netherlands|1
Robert Doornbos|Netherlands|1
Olivier Gendebien|Belgium|1
Christian Klien|Austria|1
Marc Surer|Switzerland|1

# ---- Southern Europe ----
Fernando Alonso|Spain|40
Carlos Sainz|Spain|25|Carlos Sainz Jr.
Kimi Antonelli|Italy|15|Andrea Kimi Antonelli
Alberto Ascari|Italy|6
Giuseppe Farina|Italy|4|Nino Farina
Jarno Trulli|Italy|4
Giancarlo Fisichella|Italy|4
Riccardo Patrese|Italy|3
Michele Alboreto|Italy|3
Antonio Giovinazzi|Italy|3
Pedro de la Rosa|Spain|3
Elio de Angelis|Italy|2
Andrea de Cesaris|Italy|2
Jaime Alguersuari|Spain|2
Ivan Capelli|Italy|1
Nicola Larini|Italy|1
Pierluigi Martini|Italy|1
Luca Badoer|Italy|1
Vitantonio Liuzzi|Italy|1
Roberto Merhi|Spain|1
Marc Gene|Spain|1|Marc Gené
Pedro Lamy|Portugal|1
Tiago Monteiro|Portugal|1

# ---- Eastern Europe ----
Robert Kubica|Poland|25
Daniil Kvyat|Russia|10
Vitaly Petrov|Russia|6
Nikita Mazepin|Russia|6
Sergey Sirotkin|Russia|4
Zsolt Baumgartner|Hungary|2
Jan Charouz|Czech Republic|1
Tomas Enge|Czech Republic|1|Tomáš Enge

# ---- Nordic ----
Kimi Raikkonen|Finland|40|Kimi Räikkönen; Iceman
Valtteri Bottas|Finland|25
Mika Hakkinen|Finland|20|Mika Häkkinen
Kevin Magnussen|Denmark|12
Keke Rosberg|Finland|6
Marcus Ericsson|Sweden|6
Heikki Kovalainen|Finland|5
Ronnie Peterson|Sweden|5
Mika Salo|Finland|3
Jan Magnussen|Denmark|3
JJ Lehto|Finland|2
Stefan Johansson|Sweden|2
Gunnar Nilsson|Sweden|1
Leo Kinnunen|Finland|1

# ---- Asia & Oceania ----
Daniel Ricciardo|Australia|30
Oscar Piastri|Australia|25
Mark Webber|Australia|15
Yuki Tsunoda|Japan|15
Alexander Albon|Thailand|15
Zhou Guanyu|China|12
Jack Brabham|Australia|8
Bruce McLaren|New Zealand|8
Kamui Kobayashi|Japan|6
Takuma Sato|Japan|5
Alan Jones|Australia|4
Denny Hulme|New Zealand|4
Narain Karthikeyan|India|3
Aguri Suzuki|Japan|2
Ukyo Katayama|Japan|2
Kazuki Nakajima|Japan|2
Satoru Nakajima|Japan|2
Karun Chandhok|India|2
Chris Amon|New Zealand|2
Brendon Hartley|New Zealand|2
Sakon Yamamoto|Japan|1
Rio Haryanto|Indonesia|1
Mike Thackwell|New Zealand|1
`,
);

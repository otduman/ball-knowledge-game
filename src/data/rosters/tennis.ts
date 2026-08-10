import { parseRoster } from '../parse';

/**
 * Format: Name | Country | pop | aliases (semicolon separated)
 *
 * Players are placed by the country they represented in Davis/Fed Cup and are
 * billed under. The awkward cases are the Cold War defectors: Navratilova and
 * Seles won most of their majors as Americans and sit in North America, while
 * Lendl stays with Czechoslovakia (mapped to Czech Republic).
 */
export const TENNIS = parseRoster(
  'tennis',
  `
# ---- Africa ----
Ons Jabeur|Tunisia|25
Kevin Anderson|South Africa|12
Wayne Ferreira|South Africa|6
Amanda Coetzer|South Africa|4
Johan Kriek|South Africa|3
Cliff Drysdale|South Africa|3
Lloyd Harris|South Africa|3
Raven Klaasen|South Africa|2
Malek Jaziri|Tunisia|2
Mohamed Safwat|Egypt|1

# ---- South America ----
Gustavo Kuerten|Brazil|25|Guga
Juan Martin del Potro|Argentina|25|Juan Martín del Potro; Delpo
Gabriela Sabatini|Argentina|20
Guillermo Vilas|Argentina|18
David Nalbandian|Argentina|12
Marcelo Rios|Chile|10|Marcelo Ríos
Diego Schwartzman|Argentina|10
Gaston Gaudio|Argentina|8|Gastón Gaudio
Guillermo Coria|Argentina|8
Fernando Gonzalez|Chile|8|Fernando González
Nicolas Massu|Chile|6|Nicolás Massú
Joao Fonseca|Brazil|6|João Fonseca
Francisco Cerundolo|Argentina|5|Francisco Cerúndolo
Cristian Garin|Chile|4|Cristian Garín
Nicolas Jarry|Chile|4|Nicolás Jarry
Alejandro Tabilo|Chile|3
Andres Gomez|Ecuador|3|Andrés Gómez
Thomaz Bellucci|Brazil|3
Marcelo Melo|Brazil|3
Bruno Soares|Brazil|3
Juan Monaco|Argentina|3|Juan Mónaco
Horacio Zeballos|Argentina|2
Nicolas Lapentti|Ecuador|2|Nicolás Lapentti
Pablo Cuevas|Uruguay|2
Juan Sebastian Cabal|Colombia|2|Juan Sebastián Cabal
Robert Farah|Colombia|2
Santiago Giraldo|Colombia|1
Luis Horna|Peru|1

# ---- North America ----
Serena Williams|United States|50
Pete Sampras|United States|30
Andre Agassi|United States|30
Venus Williams|United States|25
John McEnroe|United States|25
Coco Gauff|United States|22
Jimmy Connors|United States|15
Chris Evert|United States|15
Billie Jean King|United States|15
Arthur Ashe|United States|12
Andy Roddick|United States|12
Martina Navratilova|United States|15
Monica Seles|United States|10
Taylor Fritz|United States|10
Michael Chang|United States|8
Jim Courier|United States|8
Lindsay Davenport|United States|8
Jennifer Capriati|United States|6
Ben Shelton|United States|8
Frances Tiafoe|United States|8
Jessica Pegula|United States|7
Madison Keys|United States|6
Tommy Paul|United States|5
Sloane Stephens|United States|5
Sofia Kenin|United States|4
Sebastian Korda|United States|4
John Isner|United States|6
Bob Bryan|United States|4
Mike Bryan|United States|4
Reilly Opelka|United States|3
Jack Sock|United States|3
Danielle Collins|United States|4
Amanda Anisimova|United States|4
Emma Navarro|United States|4
Tracy Austin|United States|3
Stan Smith|United States|3
Milos Raonic|Canada|8
Bianca Andreescu|Canada|8
Felix Auger-Aliassime|Canada|8|Félix Auger-Aliassime
Denis Shapovalov|Canada|6
Leylah Fernandez|Canada|5
Eugenie Bouchard|Canada|5
Daniel Nestor|Canada|3
Gabriela Dabrowski|Canada|2
Rafael Osuna|Mexico|2
Renata Zarazua|Mexico|1|Renata Zarazúa

# ---- UK & Ireland ----
Andy Murray|Scotland|35
Emma Raducanu|England|20
Tim Henman|England|12
Fred Perry|England|8
Cameron Norrie|England|8
Jack Draper|England|8
Jamie Murray|Scotland|6
Virginia Wade|England|5
Greg Rusedski|England|5
Dan Evans|England|4
Kyle Edmund|England|4
Johanna Konta|England|4
Katie Boulter|England|3
Heather Watson|England|3
Joe Salisbury|England|2
Neal Skupski|England|2
Laura Robson|England|2
Ann Jones|England|2

# ---- Western Europe ----
Roger Federer|Switzerland|50
Boris Becker|Germany|20
Steffi Graf|Germany|22
Stan Wawrinka|Switzerland|15
Alexander Zverev|Germany|15
Martina Hingis|Switzerland|12
Gael Monfils|France|10|Gaël Monfils
Jo-Wilfried Tsonga|France|10
Justine Henin|Belgium|10
Kim Clijsters|Belgium|10
Dominic Thiem|Austria|10
Yannick Noah|France|8
Richard Gasquet|France|7
Angelique Kerber|Germany|7
Amelie Mauresmo|France|6|Amélie Mauresmo
David Goffin|Belgium|6
Michael Stich|Germany|5
Tommy Haas|Germany|4
Marion Bartoli|France|5
Caroline Garcia|France|5
Belinda Bencic|Switzerland|5
Thomas Muster|Austria|5
Gilles Simon|France|4
Ugo Humbert|France|4
Arthur Fils|France|5
Corentin Moutet|France|3
Lucas Pouille|France|3
Kristina Mladenovic|France|3
Mary Pierce|France|4
Henri Leconte|France|2
Guy Forget|France|2
Sabine Lisicki|Germany|3
Elise Mertens|Belgium|3
Richard Krajicek|Netherlands|4
Tom Okker|Netherlands|2
Kiki Bertens|Netherlands|3
Botic van de Zandschulp|Netherlands|2
Jurgen Melzer|Austria|2|Jürgen Melzer

# ---- Southern Europe ----
Rafael Nadal|Spain|50|Rafa Nadal
Carlos Alcaraz|Spain|40
Jannik Sinner|Italy|35
Stefanos Tsitsipas|Greece|15
Matteo Berrettini|Italy|10
David Ferrer|Spain|10
Juan Carlos Ferrero|Spain|8
Carlos Moya|Spain|8|Carlos Moyá
Arantxa Sanchez Vicario|Spain|8|Arantxa Sánchez Vicario
Garbine Muguruza|Spain|8|Garbiñe Muguruza
Lorenzo Musetti|Italy|8
Fabio Fognini|Italy|7
Conchita Martinez|Spain|6|Conchita Martínez
Sergi Bruguera|Spain|5
Feliciano Lopez|Spain|5|Feliciano López
Fernando Verdasco|Spain|5
Paula Badosa|Spain|6
Jasmine Paolini|Italy|7
Maria Sakkari|Greece|6
Roberto Bautista Agut|Spain|4
Pablo Carreno Busta|Spain|4|Pablo Carreño Busta
Nicolas Almagro|Spain|3|Nicolás Almagro
Alejandro Davidovich Fokina|Spain|4
Manuel Santana|Spain|3
Francesca Schiavone|Italy|4
Flavia Pennetta|Italy|4
Sara Errani|Italy|3
Lorenzo Sonego|Italy|3
Adriano Panatta|Italy|3
Marcos Baghdatis|Cyprus|4
Joao Sousa|Portugal|2|João Sousa
Nuno Borges|Portugal|2

# ---- Eastern Europe ----
Novak Djokovic|Serbia|50|Nole
Maria Sharapova|Russia|30
Iga Swiatek|Poland|30|Iga Świątek
Aryna Sabalenka|Belarus|25
Daniil Medvedev|Russia|20
Marat Safin|Russia|15
Goran Ivanisevic|Croatia|12|Goran Ivanišević
Simona Halep|Romania|12
Victoria Azarenka|Belarus|12
Andrey Rublev|Russia|12
Marin Cilic|Croatia|10|Marin Čilić
Petra Kvitova|Czech Republic|10|Petra Kvitová
Ana Ivanovic|Serbia|10|Ana Ivanović
Yevgeny Kafelnikov|Russia|8
Ivan Lendl|Czech Republic|12
Karen Khachanov|Russia|8
Tomas Berdych|Czech Republic|8|Tomáš Berdych
Karolina Pliskova|Czech Republic|7|Karolína Plíšková
Jelena Jankovic|Serbia|7|Jelena Janković
Grigor Dimitrov|Bulgaria|8
Hubert Hurkacz|Poland|7
Elina Svitolina|Ukraine|7
Agnieszka Radwanska|Poland|6|Agnieszka Radwańska
Barbora Krejcikova|Czech Republic|6|Barbora Krejčíková
Marketa Vondrousova|Czech Republic|6|Markéta Vondroušová
Svetlana Kuznetsova|Russia|6
Ilie Nastase|Romania|5|Ilie Năstase
Mirra Andreeva|Russia|7
Daria Kasatkina|Russia|5
Anastasia Pavlyuchenkova|Russia|4
Jelena Ostapenko|Latvia|5|Jeļena Ostapenko
Borna Coric|Croatia|5|Borna Ćorić
Donna Vekic|Croatia|4|Donna Vekić
Ivan Ljubicic|Croatia|4|Ivan Ljubičić
Dinara Safina|Russia|4
Vera Zvonareva|Russia|3
Anastasia Myskina|Russia|3
Diana Shnaider|Russia|4
Miomir Kecmanovic|Serbia|3|Miomir Kecmanović
Laslo Djere|Serbia|2
Nenad Zimonjic|Serbia|2|Nenad Zimonjić
Mate Pavic|Croatia|3|Mate Pavić
Iva Majoli|Croatia|2
Jiri Lehecka|Czech Republic|4|Jiří Lehečka
Radek Stepanek|Czech Republic|3|Radek Štěpánek
Magda Linette|Poland|3
Lukasz Kubot|Poland|2|Łukasz Kubot
Marta Kostyuk|Ukraine|4
Dayana Yastremska|Ukraine|3
Sergiy Stakhovsky|Ukraine|2
Andriy Medvedev|Ukraine|2
Sorana Cirstea|Romania|3|Sorana Cîrstea
Horia Tecau|Romania|2|Horia Tecău
Ion Tiriac|Romania|2|Ion Țiriac
Max Mirnyi|Belarus|3
Dominika Cibulkova|Slovakia|3|Dominika Cibulková
Daniela Hantuchova|Slovakia|3|Daniela Hantuchová
Dominik Hrbaty|Slovakia|2|Dominik Hrbatý
Miloslav Mecir|Slovakia|2|Miloslav Mečíř
Nikoloz Basilashvili|Georgia|3
Ernests Gulbis|Latvia|2
Anastasija Sevastova|Latvia|2
Ricardas Berankis|Lithuania|1|Ričardas Berankis
Cvetana Pironkova|Bulgaria|2
Magdalena Maleeva|Bulgaria|1

# ---- Nordic ----
Bjorn Borg|Sweden|35|Björn Borg
Stefan Edberg|Sweden|18
Mats Wilander|Sweden|15
Caroline Wozniacki|Denmark|15
Casper Ruud|Norway|15
Holger Rune|Denmark|12
Robin Soderling|Sweden|8|Robin Söderling
Jonas Bjorkman|Sweden|5|Jonas Björkman
Thomas Johansson|Sweden|5
Magnus Norman|Sweden|3
Jarkko Nieminen|Finland|4
Joachim Johansson|Sweden|2
Mikael Ymer|Sweden|2
Elias Ymer|Sweden|2
Emil Ruusuvuori|Finland|2
Anders Jarryd|Sweden|2|Anders Järryd
Kenneth Carlsen|Denmark|1

# ---- Asia & Oceania ----
Naomi Osaka|Japan|30
Kei Nishikori|Japan|15
Li Na|China|15
Nick Kyrgios|Australia|20
Lleyton Hewitt|Australia|15
Ashleigh Barty|Australia|15
Rod Laver|Australia|15
Alex de Minaur|Australia|12
Zheng Qinwen|China|10
Margaret Court|Australia|10
Ken Rosewall|Australia|8
Pat Rafter|Australia|8
Evonne Goolagong|Australia|6
Sania Mirza|India|6
Leander Paes|India|6
Mark Philippoussis|Australia|5
Sam Stosur|Australia|5
Thanasi Kokkinakis|Australia|4
Jordan Thompson|Australia|3
John Newcombe|Australia|4
Roy Emerson|Australia|4
Todd Woodbridge|Australia|3
Daria Saville|Australia|2
Kimiko Date|Japan|4
Yoshihito Nishioka|Japan|3
Hsieh Su-wei|Taiwan|4
Zhang Shuai|China|3
Peng Shuai|China|3
Wu Yibing|China|3
Lu Yen-hsun|Taiwan|2
Mahesh Bhupathi|India|3
Rohan Bopanna|India|3
Sumit Nagal|India|2
Vijay Amritraj|India|2
Ramesh Krishnan|India|1
Hyeon Chung|South Korea|3
Kwon Soon-woo|South Korea|2
Lee Duck-hee|South Korea|1
Paradorn Srichaphan|Thailand|2
Aisam-ul-Haq Qureshi|Pakistan|2
Shahar Peer|Israel|2|Shahar Pe'er
Dudi Sela|Israel|1
Jonathan Erlich|Israel|1
Andy Ram|Israel|1
Michael Venus|New Zealand|2
Chris Lewis|New Zealand|1
`,
);

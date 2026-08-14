import { parseRoster } from '../parse';

/**
 * Format: Name | Country | pop | aliases (semicolon separated)
 *
 * `pop` is the rough percentage of players expected to name this athlete for
 * their cell, so it is the inverse of rarity. Keep it relative within a region
 * rather than globally precise: 40+ is a first-instinct pick, 10-20 is a solid
 * name, 1-4 is a deep cut.
 */
export const FOOTBALL = parseRoster(
  'football',
  `
# ---- Africa ----
Mohamed Salah|Egypt|45|Mo Salah
Sadio Mane|Senegal|30|Sadio Mané
Didier Drogba|Ivory Coast|25
Samuel Eto'o|Cameroon|15|Samuel Etoo
Victor Osimhen|Nigeria|15
Pierre-Emerick Aubameyang|Gabon|12|Aubameyang
Riyad Mahrez|Algeria|12
Yaya Toure|Ivory Coast|10|Yaya Touré
Achraf Hakimi|Morocco|10
George Weah|Liberia|8
Jay-Jay Okocha|Nigeria|6|Austin Okocha
Mohammed Kudus|Ghana|6|Mohamed Kudus
Roger Milla|Cameroon|6
Andre Onana|Cameroon|5|André Onana
Nwankwo Kanu|Nigeria|5
Ademola Lookman|Nigeria|5
Thomas Partey|Ghana|5
Hakim Ziyech|Morocco|5
Michael Essien|Ghana|4
Emmanuel Adebayor|Togo|4
Kalidou Koulibaly|Senegal|4
Edouard Mendy|Senegal|4|Édouard Mendy
Serhou Guirassy|Guinea|4
Yassine Bounou|Morocco|4|Bono
Asamoah Gyan|Ghana|3
Wilfried Zaha|Ivory Coast|3
Abedi Pele|Ghana|3|Abedi Pelé
Obafemi Martins|Nigeria|3
Frederic Kanoute|Mali|3|Frédéric Kanouté
El Hadji Diouf|Senegal|3
Sebastien Haller|Ivory Coast|3|Sébastien Haller
Youssef En-Nesyri|Morocco|3
Nicolas Pepe|Ivory Coast|3|Nicolas Pépé
Kelechi Iheanacho|Nigeria|3
Alex Iwobi|Nigeria|3
Wilfred Ndidi|Nigeria|3
Naby Keita|Guinea|3|Naby Keïta
Ismaila Sarr|Senegal|3
Franck Kessie|Ivory Coast|2|Franck Kessié
Sofyan Amrabat|Morocco|2
Rabah Madjer|Algeria|2
Seydou Keita|Mali|2
Sofiane Boufal|Morocco|2
Vincent Aboubakar|Cameroon|2
Eric Bailly|Ivory Coast|2
Mohamed Aboutrika|Egypt|2
Mahmoud Trezeguet|Egypt|2|Trezeguet
Bertrand Traore|Burkina Faso|2|Bertrand Traoré
Chancel Mbemba|DR Congo|2
Cedric Bakambu|DR Congo|2|Cédric Bakambu
Yves Bissouma|Mali|2
Jordan Ayew|Ghana|2
Andre Ayew|Ghana|2|André Ayew
Lucas Radebe|South Africa|2
Benni McCarthy|South Africa|2
Steven Pienaar|South Africa|2
Kalusha Bwalya|Zambia|1

# ---- South America ----
Lionel Messi|Argentina|55|Leo Messi
Neymar|Brazil|30|Neymar Jr
Diego Maradona|Argentina|25
Pele|Brazil|25|Pelé
Ronaldo|Brazil|20|Ronaldo Nazario; R9; O Fenomeno
Luis Suarez|Uruguay|15|Luis Suárez
Sergio Aguero|Argentina|12|Sergio Agüero; Kun Aguero
Ronaldinho|Brazil|12
Vinicius Junior|Brazil|10|Vinícius Júnior; Vini Jr
Edinson Cavani|Uruguay|10
James Rodriguez|Colombia|10|James Rodríguez
Julian Alvarez|Argentina|10|Julián Álvarez
Kaka|Brazil|10|Kaká
Angel Di Maria|Argentina|8|Ángel Di María
Lautaro Martinez|Argentina|8|Lautaro Martínez
Luis Diaz|Colombia|8|Luis Díaz
Roberto Carlos|Brazil|8
Emiliano Martinez|Argentina|8|Emiliano Martínez; Dibu Martinez
Paulo Dybala|Argentina|8
Casemiro|Brazil|7
Enzo Fernandez|Argentina|6|Enzo Fernández
Carlos Tevez|Argentina|6|Carlos Tévez
Alexis Sanchez|Chile|6|Alexis Sánchez
Darwin Nunez|Uruguay|6|Darwin Núñez
Radamel Falcao|Colombia|6
Alisson|Brazil|6|Alisson Becker
Thiago Silva|Brazil|6
Marcelo|Brazil|6
Dani Alves|Brazil|6
Rivaldo|Brazil|6
Romario|Brazil|6|Romário
Cafu|Brazil|6
Rodrygo|Brazil|6
Raphinha|Brazil|6
Gabriel Batistuta|Argentina|6
Federico Valverde|Uruguay|6
Alexis Mac Allister|Argentina|6
Carlos Valderrama|Colombia|6
Arturo Vidal|Chile|5
Diego Forlan|Uruguay|5|Diego Forlán
Moises Caicedo|Ecuador|5|Moisés Caicedo
Ederson|Brazil|5
Gabriel Jesus|Brazil|5
Rodrigo De Paul|Argentina|5
Cristian Romero|Argentina|5
Gonzalo Higuain|Argentina|5|Gonzalo Higuaín
Ronald Araujo|Uruguay|5|Ronald Araújo
Marta|Brazil|5
Richarlison|Brazil|4
Bruno Guimaraes|Brazil|4|Bruno Guimarães
Javier Mascherano|Argentina|4
Juan Roman Riquelme|Argentina|4|Juan Román Riquelme
Mauro Icardi|Argentina|4
Diego Godin|Uruguay|4|Diego Godín
Rene Higuita|Colombia|4|René Higuita
Zico|Brazil|4
Eder Militao|Brazil|3|Éder Militão
Nicolas Otamendi|Argentina|3|Nicolás Otamendi
Hernan Crespo|Argentina|3|Hernán Crespo
Rodrigo Bentancur|Uruguay|3
Enner Valencia|Ecuador|3
Antonio Valencia|Ecuador|3
Claudio Bravo|Chile|3
Socrates|Brazil|3|Sócrates
Julio Cesar|Brazil|3|Júlio César
Jhon Duran|Colombia|3|Jhon Durán
Jose Luis Chilavert|Paraguay|3|José Luis Chilavert
Gary Medel|Chile|2
Eduardo Vargas|Chile|2
Ivan Zamorano|Chile|2|Iván Zamorano
Marcelo Salas|Chile|2
Davinson Sanchez|Colombia|2|Davinson Sánchez
Yerry Mina|Colombia|2
Paolo Guerrero|Peru|2
Jefferson Farfan|Peru|2|Jefferson Farfán
Roque Santa Cruz|Paraguay|2
Salomon Rondon|Venezuela|2|Salomón Rondón

# ---- North America ----
Christian Pulisic|United States|20
Javier Hernandez|Mexico|10|Chicharito; Javier Hernández
Landon Donovan|United States|10
Megan Rapinoe|United States|10
Alex Morgan|United States|10
Alphonso Davies|Canada|12
Clint Dempsey|United States|8
Tim Howard|United States|8
Weston McKennie|United States|8
Guillermo Ochoa|Mexico|8
Keylor Navas|Costa Rica|8
Jonathan David|Canada|8
Mia Hamm|United States|8
Hirving Lozano|Mexico|6|Chucky Lozano
Rafael Marquez|Mexico|6|Rafael Márquez
Tyler Adams|United States|5
Gio Reyna|United States|5
Carlos Vela|Mexico|5
Raul Jimenez|Mexico|5|Raúl Jiménez
Hugo Sanchez|Mexico|5|Hugo Sánchez
Dwight Yorke|Trinidad and Tobago|5
Leon Bailey|Jamaica|5
Abby Wambach|United States|5
Christine Sinclair|Canada|5
Yunus Musah|United States|4
Folarin Balogun|United States|4
Sergino Dest|United States|4|Sergiño Dest
Andres Guardado|Mexico|4|Andrés Guardado
Santiago Gimenez|Mexico|4|Santiago Giménez
Sophia Smith|United States|4
Trinity Rodman|United States|4
Ricardo Pepi|United States|3
Matt Turner|United States|3
Brenden Aaronson|United States|3
Antonee Robinson|United States|3
Jozy Altidore|United States|3
Michael Bradley|United States|3
Cuauhtemoc Blanco|Mexico|3|Cuauhtémoc Blanco
Edson Alvarez|Mexico|3|Edson Álvarez
Michail Antonio|Jamaica|3
DaMarcus Beasley|United States|2
Brian McBride|United States|2
Kasey Keller|United States|2
Cyle Larin|Canada|2
Stephen Eustaquio|Canada|2|Stephen Eustáquio
Atiba Hutchinson|Canada|2
Bryan Ruiz|Costa Rica|2
Paulo Wanchope|Costa Rica|2
Shaka Hislop|Trinidad and Tobago|1

# ---- UK & Ireland ----
David Beckham|England|30
Harry Kane|England|25
Wayne Rooney|England|20
Jude Bellingham|England|20
Steven Gerrard|England|12
Frank Lampard|England|10
Phil Foden|England|10
Bukayo Saka|England|10
Roy Keane|Ireland|10
Gareth Bale|Wales|10
Alan Shearer|England|8
Marcus Rashford|England|8
Trent Alexander-Arnold|England|8
Bobby Charlton|England|8
Michael Owen|England|8
Raheem Sterling|England|8
Cole Palmer|England|8
George Best|Northern Ireland|8
Jack Grealish|England|7
Ryan Giggs|Wales|6
Declan Rice|England|6
Robbie Keane|Ireland|6
Gary Lineker|England|6
Andy Robertson|Scotland|6
Paul Scholes|England|5
Jordan Pickford|England|5
Paul Gascoigne|England|5
Jamie Vardy|England|5
Kyle Walker|England|5
Harry Maguire|England|5
Rio Ferdinand|England|4
John Terry|England|4
Shay Given|Ireland|4
Damien Duff|Ireland|4
Ashley Cole|England|4
Jordan Henderson|England|4
John Stones|England|4
Ollie Watkins|England|4
Mason Mount|England|4
Scott McTominay|Scotland|4
Aaron Ramsey|Wales|4
Gordon Banks|England|4
Lucy Bronze|England|4
Leah Williamson|England|4
Beth Mead|England|4
Kenny Dalglish|Scotland|3
Seamus Coleman|Ireland|3|Séamus Coleman
Evan Ferguson|Ireland|3
David Seaman|England|3
Aaron Ramsdale|England|3
John McGinn|Scotland|3
Ian Rush|Wales|3
Peter Shilton|England|3
Martin O'Neill|Northern Ireland|3
Lauren James|England|3
Caoimhin Kelleher|Ireland|2|Caoimhín Kelleher
Kieran Tierney|Scotland|2
Joe Allen|Wales|2
Ethan Ampadu|Wales|2
Daniel James|Wales|2
Pat Jennings|Northern Ireland|2
Katie McCabe|Ireland|2
Steven Davis|Northern Ireland|1
Norman Whiteside|Northern Ireland|1

# ---- Western Europe ----
Kylian Mbappe|France|45|Kylian Mbappé
Zinedine Zidane|France|30|Zizou
Kevin De Bruyne|Belgium|20
Thierry Henry|France|20
Antoine Griezmann|France|15
Karim Benzema|France|15
Johan Cruyff|Netherlands|15
Manuel Neuer|Germany|12
Thomas Muller|Germany|12|Thomas Müller
Toni Kroos|Germany|12
Paul Pogba|France|12
Virgil van Dijk|Netherlands|12
Eden Hazard|Belgium|12
Marco van Basten|Netherlands|10
Jamal Musiala|Germany|10
N'Golo Kante|France|10|N'Golo Kanté
Romelu Lukaku|Belgium|10
Thibaut Courtois|Belgium|10
Miroslav Klose|Germany|8
Bastian Schweinsteiger|Germany|8
Mesut Ozil|Germany|8|Mesut Özil
Franz Beckenbauer|Germany|8
Florian Wirtz|Germany|8
Dennis Bergkamp|Netherlands|8
Arjen Robben|Netherlands|8
Robin van Persie|Netherlands|8
Frenkie de Jong|Netherlands|8
Ousmane Dembele|France|8|Ousmane Dembélé
Philipp Lahm|Germany|6
Gerd Muller|Germany|6|Gerd Müller
Oliver Kahn|Germany|6
Kai Havertz|Germany|6
Joshua Kimmich|Germany|6
Michel Platini|France|6
Olivier Giroud|France|6
Hugo Lloris|France|6
Raphael Varane|France|6|Raphaël Varane
Franck Ribery|France|6|Franck Ribéry
Ruud Gullit|Netherlands|6
Matthijs de Ligt|Netherlands|6
Ruud van Nistelrooy|Netherlands|6
Memphis Depay|Netherlands|6
Vincent Kompany|Belgium|6
David Alaba|Austria|6
Lothar Matthaus|Germany|5|Lothar Matthäus
Leroy Sane|Germany|5|Leroy Sané
Ilkay Gundogan|Germany|5|İlkay Gündoğan
Antonio Rudiger|Germany|5|Antonio Rüdiger
Marc-Andre ter Stegen|Germany|5|Marc-André ter Stegen
Patrick Vieira|France|5
Didier Deschamps|France|5
Aurelien Tchouameni|France|5|Aurélien Tchouaméni
Eduardo Camavinga|France|5
William Saliba|France|5
Wesley Sneijder|Netherlands|5
Cody Gakpo|Netherlands|5
Xavi Simons|Netherlands|5
Edwin van der Sar|Netherlands|5
Xherdan Shaqiri|Switzerland|5
Granit Xhaka|Switzerland|5
Michael Ballack|Germany|4
Jurgen Klinsmann|Germany|4|Jürgen Klinsmann
Mario Gotze|Germany|4|Mario Götze
Serge Gnabry|Germany|4
Kingsley Coman|France|4
Mike Maignan|France|4
Jules Kounde|France|4|Jules Koundé
Theo Hernandez|France|4|Theo Hernández
Marcus Thuram|France|4
Clarence Seedorf|Netherlands|4
Patrick Kluivert|Netherlands|4
Dries Mertens|Belgium|4
Jeremy Doku|Belgium|4|Jérémy Doku
Lilian Thuram|France|3
Marcel Desailly|France|3
Fabien Barthez|France|3
Robert Pires|France|3|Robert Pirès
David Trezeguet|France|3
Warren Zaire-Emery|France|3|Warren Zaïre-Emery
Wendie Renard|France|3
Jan Vertonghen|Belgium|3
Youri Tielemans|Belgium|3
Marko Arnautovic|Austria|3|Marko Arnautović
Yann Sommer|Switzerland|3
Manuel Akanji|Switzerland|3
Rudi Voller|Germany|2|Rudi Völler
Andre Schurrle|Germany|2|André Schürrle
Alexandra Popp|Germany|2
Birgit Prinz|Germany|2
Kadidiatou Diani|France|2
Frank de Boer|Netherlands|2
Axel Witsel|Belgium|2
Amadou Onana|Belgium|2
Konrad Laimer|Austria|2
Marcel Sabitzer|Austria|2
Breel Embolo|Switzerland|2
Just Fontaine|France|1
Raymond Kopa|France|1
Stephan Lichtsteiner|Switzerland|1

# ---- Southern Europe ----
Cristiano Ronaldo|Portugal|55|CR7
Lamine Yamal|Spain|20
Andres Iniesta|Spain|15|Andrés Iniesta
Xavi|Spain|12|Xavi Hernandez
Sergio Ramos|Spain|12
Rodri|Spain|12|Rodrigo Hernandez
Gianluigi Buffon|Italy|12
Bruno Fernandes|Portugal|12
Iker Casillas|Spain|10
Fernando Torres|Spain|10
Pedri|Spain|10
Paolo Maldini|Italy|10
Francesco Totti|Italy|10
Andrea Pirlo|Italy|10
Luis Figo|Portugal|10
David Villa|Spain|8
Gerard Pique|Spain|8|Gerard Piqué
Gavi|Spain|8
Nico Williams|Spain|8
David de Gea|Spain|8
Alexia Putellas|Spain|8
Aitana Bonmati|Spain|8|Aitana Bonmatí
Alessandro Del Piero|Italy|8
Roberto Baggio|Italy|8
Gianluigi Donnarumma|Italy|8
Ruben Dias|Portugal|8|Rúben Dias
Bernardo Silva|Portugal|8
Eusebio|Portugal|8|Eusébio
Rafael Leao|Portugal|7|Rafael Leão
Alvaro Morata|Spain|6|Álvaro Morata
Raul|Spain|6|Raúl
Carles Puyol|Spain|6
Xabi Alonso|Spain|6
Sergio Busquets|Spain|6
Cesc Fabregas|Spain|6|Cesc Fàbregas
Fabio Cannavaro|Italy|6
Giorgio Chiellini|Italy|6
Joao Felix|Portugal|6|João Félix
Diogo Jota|Portugal|6
Dani Olmo|Spain|5
Federico Chiesa|Italy|5
Pepe|Portugal|5
Marco Asensio|Spain|4
Mikel Oyarzabal|Spain|4
Unai Simon|Spain|4|Unai Simón
Isco|Spain|4
Salma Paralluelo|Spain|4
Jenni Hermoso|Spain|4
Marco Verratti|Italy|4
Leonardo Bonucci|Italy|4
Nicolo Barella|Italy|4|Nicolò Barella
Ciro Immobile|Italy|4
Vitinha|Portugal|4
Nani|Portugal|4
Joao Cancelo|Portugal|4|João Cancelo
Aymeric Laporte|Spain|3
Koke|Spain|3
Filippo Inzaghi|Italy|3
Daniele De Rossi|Italy|3
Sandro Tonali|Italy|3
Alessandro Bastoni|Italy|3
Christian Vieri|Italy|3
Deco|Portugal|3
Ricardo Quaresma|Portugal|3
Goncalo Ramos|Portugal|3|Gonçalo Ramos
Gianluca Vialli|Italy|2
Mateo Retegui|Italy|2
Rui Costa|Portugal|2
Giorgos Karagounis|Greece|2
Theodoros Zagorakis|Greece|2
Kostas Manolas|Greece|2
Angelos Charisteas|Greece|2
Sokratis Papastathopoulos|Greece|2|Sokratis
Konstantinos Mavropanos|Greece|1

# ---- Eastern Europe ----
Luka Modric|Croatia|40|Luka Modrić
Robert Lewandowski|Poland|40
Khvicha Kvaratskhelia|Georgia|15|Kvara
Andriy Shevchenko|Ukraine|12
Dominik Szoboszlai|Hungary|10
Jan Oblak|Slovenia|10
Dusan Vlahovic|Serbia|10|Dušan Vlahović
Edin Dzeko|Bosnia and Herzegovina|10|Edin Džeko
Petr Cech|Czech Republic|10|Petr Čech
Wojciech Szczesny|Poland|8|Wojciech Szczęsny
Aleksandar Mitrovic|Serbia|8|Aleksandar Mitrović
Ivan Perisic|Croatia|8|Ivan Perišić
Mateo Kovacic|Croatia|8|Mateo Kovačić
Nemanja Vidic|Serbia|8|Nemanja Vidić
Gheorghe Hagi|Romania|8
Pavel Nedved|Czech Republic|8|Pavel Nedvěd
Oleksandr Zinchenko|Ukraine|8
Benjamin Sesko|Slovenia|8|Benjamin Šeško
Dimitar Berbatov|Bulgaria|8
Ferenc Puskas|Hungary|8|Ferenc Puskás
Arda Guler|Turkiye|8|Arda Güler
Marek Hamsik|Slovakia|6|Marek Hamšík
Sergej Milinkovic-Savic|Serbia|6|Sergej Milinković-Savić
Hristo Stoichkov|Bulgaria|6
Josko Gvardiol|Croatia|6|Joško Gvardiol
Hakan Calhanoglu|Turkiye|6|Hakan Çalhanoğlu
Miralem Pjanic|Bosnia and Herzegovina|5|Miralem Pjanić
Nemanja Matic|Serbia|5|Nemanja Matić
Mykhailo Mudryk|Ukraine|5
Piotr Zielinski|Poland|5|Piotr Zieliński
Davor Suker|Croatia|5|Davor Šuker
Kenan Yildiz|Turkiye|5|Kenan Yıldız
Dominik Livakovic|Croatia|4|Dominik Livaković
Zvonimir Boban|Croatia|4
Milan Skriniar|Slovakia|4|Milan Škriniar
Andriy Yarmolenko|Ukraine|4
Marcelo Brozovic|Croatia|4|Marcelo Brozović
Branislav Ivanovic|Serbia|4|Branislav Ivanović
Andrey Arshavin|Russia|4
Goran Pandev|North Macedonia|3
Robert Prosinecki|Croatia|3|Robert Prosinečki
Andrej Kramaric|Croatia|3|Andrej Kramarić
Dejan Lovren|Croatia|3
Merih Demiral|Turkiye|3
Hakan Sukur|Turkiye|3|Hakan Şükür
Arkadiusz Milik|Poland|3
Samir Handanovic|Slovenia|3|Samir Handanović
Aleksandar Kolarov|Serbia|3
Dejan Stankovic|Serbia|3|Dejan Stanković
Artem Dovbyk|Ukraine|3
Georgiy Sudakov|Ukraine|3
Andriy Lunin|Ukraine|3
Igor Akinfeev|Russia|3
Aleksandr Golovin|Russia|3
Tomas Rosicky|Czech Republic|3|Tomáš Rosický
Patrik Schick|Czech Republic|3
Eljif Elmas|North Macedonia|2
Burak Yilmaz|Turkiye|2|Burak Yılmaz
Rustu Recber|Turkiye|2|Rüştü Reçber
Jakub Blaszczykowski|Poland|2|Jakub Błaszczykowski
Grzegorz Krychowiak|Poland|2
Cristian Chivu|Romania|2
Adrian Mutu|Romania|2
Josip Ilicic|Slovenia|2|Josip Iličić
Filip Kostic|Serbia|2|Filip Kostić
Predrag Mijatovic|Montenegro|2|Predrag Mijatović
Stevan Jovetic|Montenegro|2|Stevan Jovetić
Dejan Savicevic|Montenegro|2|Dejan Savićević
Sergiy Rebrov|Ukraine|2
Ruslan Malinovskyi|Ukraine|2
Artem Dzyuba|Russia|2
Milan Baros|Czech Republic|2|Milan Baroš
Gabor Kiraly|Hungary|2|Gábor Király
Peter Gulacsi|Hungary|2|Péter Gulácsi
Roland Sallai|Hungary|2
Armando Broja|Albania|2
Nihat Kahveci|Turkiye|1
Emre Belozoglu|Turkiye|1|Emre Belözoğlu
Vlad Chiriches|Romania|1|Vlad Chiricheș
Zlatko Zahovic|Slovenia|1|Zlatko Zahovič
Anatoliy Tymoshchuk|Ukraine|1
Yevhen Konoplyanka|Ukraine|1
Yuri Zhirkov|Russia|1
Aleksandr Kerzhakov|Russia|1
Roman Pavlyuchenko|Russia|1
Vladimir Smicer|Czech Republic|1|Vladimír Šmicer
Berat Djimsiti|Albania|1

# ---- Nordic ----
Zlatan Ibrahimovic|Sweden|40|Zlatan Ibrahimović; Zlatan
Erling Haaland|Norway|40
Martin Odegaard|Norway|15|Martin Ødegaard
Christian Eriksen|Denmark|12
Peter Schmeichel|Denmark|10
Ole Gunnar Solskjaer|Norway|10|Ole Gunnar Solskjær
Alexander Isak|Sweden|10
Viktor Gyokeres|Sweden|10|Viktor Gyökeres
Rasmus Hojlund|Denmark|8|Rasmus Højlund
Henrik Larsson|Sweden|8
Freddie Ljungberg|Sweden|6
Dejan Kulusevski|Sweden|6
Kasper Schmeichel|Denmark|5
Alexander Sorloth|Norway|5|Alexander Sørloth
John Arne Riise|Norway|5
Michael Laudrup|Denmark|5
Ada Hegerberg|Norway|5
Pierre-Emile Hojbjerg|Denmark|4|Pierre-Emile Højbjerg
Jari Litmanen|Finland|4
Sami Hyypia|Finland|4|Sami Hyypiä
Gylfi Sigurdsson|Iceland|4|Gylfi Sigurðsson
Simon Kjaer|Denmark|4|Simon Kjær
Anthony Elanga|Sweden|4
Victor Lindelof|Sweden|4|Victor Lindelöf
Nicklas Bendtner|Denmark|4
Teemu Pukki|Finland|3
Eidur Gudjohnsen|Iceland|3|Eiður Guðjohnsen
Emil Forsberg|Sweden|3
Andreas Christensen|Denmark|3
Brian Laudrup|Denmark|3
Caroline Graham Hansen|Norway|3
Pernille Harder|Denmark|3
Robin Olsen|Sweden|2
Mikkel Damsgaard|Denmark|2
Andreas Skov Olsen|Denmark|2
Joachim Andersen|Denmark|2
Kasper Dolberg|Denmark|2
Tore Andre Flo|Norway|2|Tore André Flo
Joshua King|Norway|2
Sander Berge|Norway|2
Aron Gunnarsson|Iceland|2
Hannes Halldorsson|Iceland|2|Hannes Þór Halldórsson
Lukas Hradecky|Finland|2
Magdalena Eriksson|Sweden|2
Fridolina Rolfo|Sweden|2|Fridolina Rolfö
Olof Mellberg|Sweden|1
Morten Gamst Pedersen|Norway|1
Kristoffer Ajer|Norway|1
Alfred Finnbogason|Iceland|1|Alfreð Finnbogason
Kolbeinn Sigthorsson|Iceland|1|Kolbeinn Sigþórsson
Johann Berg Gudmundsson|Iceland|1|Jóhann Berg Guðmundsson
Glen Kamara|Finland|1

# ---- Asia & Oceania ----
Son Heung-min|South Korea|25|Heung-min Son; Sonny
Park Ji-sung|South Korea|10
Kaoru Mitoma|Japan|8
Tim Cahill|Australia|8
Sam Kerr|Australia|8
Kim Min-jae|South Korea|8
Lee Kang-in|South Korea|6
Hidetoshi Nakata|Japan|6
Shinji Kagawa|Japan|6
Keisuke Honda|Japan|6
Takefusa Kubo|Japan|6
Harry Kewell|Australia|6
Mehdi Taremi|Iran|5
Hwang Hee-chan|South Korea|4
Wataru Endo|Japan|4
Takumi Minamino|Japan|4
Mark Viduka|Australia|4
Ali Daei|Iran|4
Sardar Azmoun|Iran|4
Salem Al-Dawsari|Saudi Arabia|4
Sunil Chhetri|India|4
Cha Bum-kun|South Korea|3
Daichi Kamada|Japan|3
Maya Yoshida|Japan|3
Shinji Okazaki|Japan|3
Ritsu Doan|Japan|3
Mark Schwarzer|Australia|3
Aaron Mooy|Australia|3
Mathew Ryan|Australia|3
Chris Wood|New Zealand|3
Akram Afif|Qatar|3
Wu Lei|China|3
Ki Sung-yueng|South Korea|2
Yuto Nagatomo|Japan|2
Ao Tanaka|Japan|2
Kazuyoshi Miura|Japan|2
Mile Jedinak|Australia|2
Jackson Irvine|Australia|2
Ellie Carpenter|Australia|2
Ryan Nelsen|New Zealand|2
Winston Reid|New Zealand|2
Alireza Jahanbakhsh|Iran|2
Alireza Beiranvand|Iran|2
Almoez Ali|Qatar|2
Chanathip Songkrasin|Thailand|2
Omar Abdulrahman|United Arab Emirates|2
Yasser Al-Shahrani|Saudi Arabia|1
Mohammed Al-Owais|Saudi Arabia|1
Bhaichung Bhutia|India|1
Hao Haidong|China|1
Zheng Zhi|China|1
Craig Goodwin|Australia|1
# ---- England, Scotland, Wales and Ireland - Premier League era depth, not just superstars ----
Ally McCoist|Scotland|3|Alistair McCoist; Super Ally
Andy Cole|England|4|Andrew Cole
Ashley Williams|Wales|2
Barry Ferguson|Scotland|2
Ben Davies|Wales|3
Billy Bremner|Scotland|2|William Bremner
Billy Gilmour|Scotland|3|William Gilmour
Brennan Johnson|Wales|3
Bryan Robson|England|4|Captain Marvel
Chris Waddle|England|2|Christopher Waddle
Craig Bellamy|Wales|3
Darren Fletcher|Scotland|3
Denis Irwin|Ireland|3
Denis Law|Scotland|4|The King
Emile Heskey|England|4
Gareth Barry|England|3
Gary McAllister|Scotland|2
Gary Neville|England|5
Gary Speed|Wales|3
Graeme Souness|Scotland|3|Graham Souness
Ian Wright|England|5
James McClean|Ireland|2
Jamie Carragher|England|5|Carra
Jarrod Bowen|England|4
Jermain Defoe|England|4|Jermaine Defoe
John Barnes|England|4
John Charles|Wales|2|Il Gigante Buono
John O'Shea|Ireland|3|John OShea
Kieran Trippier|England|4
Ledley King|England|2
Liam Brady|Ireland|3|Chippy Brady
Mark Hughes|Wales|3|Sparky
Mary Earps|England|4
Matt Le Tissier|England|4|Matthew Le Tissier; Le God
Michael Carrick|England|4
Nathan Collins|Ireland|2
Neville Southall|Wales|3|Big Nev
Niall Quinn|Ireland|3
Packie Bonner|Ireland|2|Patrick Bonner
Paul McGrath|Ireland|3
Peter Crouch|England|5
Richard Dunne|Ireland|3
Scott Brown|Scotland|2|Broony
Sol Campbell|England|3|Sulzeer Campbell
Steve McManaman|England|3|Macca
Teddy Sheringham|England|5|Edward Sheringham
Tony Adams|England|4|Anthony Adams

# ---- Brazil, Argentina, Uruguay, Colombia, Chile and the rest of South America ----
Adriano|Brazil|6|Adriano Imperador; Adriano Leite Ribeiro
Alberto Spencer|Ecuador|2|Alberto Pedro Spencer
Alejandro Garnacho|Argentina|6|Garnacho
Alvaro Recoba|Uruguay|3|Álvaro Recoba; El Chino Recoba
Andres Escobar|Colombia|3|Andrés Escobar
Bebeto|Brazil|6|Jose Roberto Gama de Oliveira
Ben Brereton Diaz|Chile|3|Ben Brereton; Ben Brereton Díaz
Carlos Alberto Torres|Brazil|4|Carlos Alberto
Carlos Gamarra|Paraguay|2
Charles Aranguiz|Chile|3|Charles Aránguiz
Claudio Caniggia|Argentina|3|El Hijo del Viento
Claudio Pizarro|Peru|4
Daniel Passarella|Argentina|3|El Gran Capitan
Diego Simeone|Argentina|8|El Cholo; Cholo Simeone
Dunga|Brazil|5|Carlos Dunga
Elias Figueroa|Chile|2|Elías Figueroa
Enzo Francescoli|Uruguay|4|El Principe; El Príncipe
Faustino Asprilla|Colombia|4|Tino Asprilla
Fernando Redondo|Argentina|3|Fernando Carlos Redondo
Freddy Rincon|Colombia|2|Freddy Rincón; Freddie Rincon
Garrincha|Brazil|12|Mane Garrincha; Mané Garrincha; Manuel Francisco dos Santos
Gianluca Lapadula|Peru|2
Ivan Cordoba|Colombia|2|Iván Córdoba
Jairzinho|Brazil|5|Jair Ventura Filho
Javier Zanetti|Argentina|5|Pupi Zanetti
Jorge Valdivia|Chile|2|El Mago Valdivia
Jose Maria Gimenez|Uruguay|4|José María Giménez; Josema Gimenez
Juan Alberto Schiaffino|Uruguay|2|Schiaffino; Pepe Schiaffino
Juan Arango|Venezuela|2|Juan Fernando Arango
Juan Cuadrado|Colombia|5|Juan Guillermo Cuadrado
Juan Sebastian Veron|Argentina|4|Juan Sebastián Verón; La Brujita; Seba Veron
Julio Cesar Romero|Paraguay|1|Romerito; Julio César Romero
Lucio|Brazil|4|Lúcio; Lucimar Ferreira da Silva
Manuel Ugarte|Uruguay|3
Marcelo Martins Moreno|Bolivia|1|Marcelo Moreno; Marcelo Moreno Martins
Marco Etcheverry|Bolivia|2|El Diablo Etcheverry
Mario Kempes|Argentina|5|Mario Alberto Kempes; El Matador
Miguel Almiron|Paraguay|5|Miguel Almirón
Nolberto Solano|Peru|3|Nobby Solano
Oscar Cardozo|Paraguay|2|Óscar Cardozo
Pervis Estupinan|Ecuador|3|Pervis Estupiñán
Philippe Coutinho|Brazil|8|Coutinho
Piero Hincapie|Ecuador|4|Piero Hincapié
Roberto Firmino|Brazil|8|Firmino; Bobby Firmino
Sheraldo Becker|Suriname|2
Taffarel|Brazil|4|Claudio Taffarel; Cláudio Taffarel
Teofilo Cubillas|Peru|3|Teófilo Cubillas; Nene Cubillas
Tomas Rincon|Venezuela|2|Tomás Rincón; El General

`,
);
